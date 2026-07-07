import { unstable_cache } from "next/cache";
import {
  buildCompositeSnapshot,
  buildMetricSnapshotsFromDefinitions,
  getMetrics,
  resolveMetricCatalog,
  type CompositeSnapshot,
  type HistoryPoint,
  type MetricDefinition,
  type MetricSnapshot,
} from "./bubble";
import { createPublicSupabaseClient } from "./supabase/public";

type MetricRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  unit: string;
  orientation_higher_is_frothier: boolean;
  description_short: string;
  description_long: string;
  why_it_matters: string;
  source_name: string;
  source_url: string;
  update_frequency: string;
  caveats: string;
  included_in_composite: boolean;
};

type MetricValueRow = {
  metric_id: string;
  date: string;
  value: number | string;
};

export type DashboardData = {
  metrics: MetricDefinition[];
  snapshots: MetricSnapshot[];
  composite: CompositeSnapshot;
  fromSupabase: boolean;
};

function fallbackDashboardData(): DashboardData {
  const metrics = getMetrics();
  const snapshots = buildMetricSnapshotsFromDefinitions(metrics);
  return {
    metrics,
    snapshots,
    composite: buildCompositeSnapshot(snapshots),
    fromSupabase: false,
  };
}

function mapMetric(row: MetricRow, values: HistoryPoint[]): MetricDefinition {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    unit: row.unit,
    descriptionShort: row.description_short,
    descriptionLong: row.description_long,
    whyItMatters: row.why_it_matters,
    caveats: row.caveats,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    updateFrequency: row.update_frequency,
    orientationHigherIsFrothier: row.orientation_higher_is_frothier,
    includedInComposite: row.included_in_composite,
    history: values,
  };
}

async function fetchAllMetricValues(
  supabase: NonNullable<ReturnType<typeof createPublicSupabaseClient>>,
): Promise<{ rows: MetricValueRow[]; error: unknown }> {
  const pageSize = 1000;
  const rows: MetricValueRow[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("metric_values")
      .select("metric_id,date,value")
      .order("date")
      .range(offset, offset + pageSize - 1);
    if (error) {
      return { rows, error };
    }
    rows.push(...((data ?? []) as MetricValueRow[]));
    if (!data || data.length < pageSize) {
      break;
    }
  }
  return { rows, error: null };
}

async function fetchLiveDashboardData(): Promise<DashboardData> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    throw new Error("fetchLiveDashboardData: Supabase is not configured");
  }

  const [{ data: metricRows, error: metricError }, { rows: valueRows, error: valueError }] = await Promise.all([
    supabase.from("metrics").select("*").eq("active", true).order("category").order("name"),
    fetchAllMetricValues(supabase),
  ]);

  if (metricError || valueError || !metricRows?.length) {
    console.error("fetchLiveDashboardData: falling back to static catalog", { metricError, valueError });
    throw new Error("fetchLiveDashboardData: failed to load live data");
  }

  const valuesByMetric = new Map<string, HistoryPoint[]>();
  for (const row of valueRows) {
    const values = valuesByMetric.get(row.metric_id) ?? [];
    values.push({ date: row.date, value: Number(row.value) });
    valuesByMetric.set(row.metric_id, values);
  }

  const liveMetrics = (metricRows as MetricRow[])
    .map((metric) => mapMetric(metric, valuesByMetric.get(metric.id) ?? []))
    .filter((metric) => metric.history.length > 0);

  const catalog = resolveMetricCatalog(liveMetrics, getMetrics());
  if (!catalog.fromSupabase) {
    console.warn("fetchLiveDashboardData: live metrics below threshold, using static catalog", {
      liveCount: liveMetrics.length,
      liveIds: liveMetrics.map((metric) => metric.id),
    });
  }
  const metrics = catalog.metrics;
  const snapshots = buildMetricSnapshotsFromDefinitions(metrics);
  return {
    metrics,
    snapshots,
    composite: buildCompositeSnapshot(snapshots),
    fromSupabase: catalog.fromSupabase,
  };
}

// Ingestion runs once a day (see .github/workflows/market-bubble-ingest.yml), so an hour of
// staleness is invisible to users but saves a full metric_values table scan on every request.
const getCachedLiveDashboardData = unstable_cache(fetchLiveDashboardData, ["dashboard-data"], {
  revalidate: 3600,
});

export async function getDashboardData(): Promise<DashboardData> {
  try {
    return await getCachedLiveDashboardData();
  } catch {
    return fallbackDashboardData();
  }
}

export async function getMetricDataBySlug(slug: string) {
  const data = await getDashboardData();
  const metric = data.metrics.find((entry) => entry.slug === slug) ?? null;
  const snapshot = data.snapshots.find((entry) => entry.metric.slug === slug) ?? null;
  return { ...data, metric, snapshot };
}
