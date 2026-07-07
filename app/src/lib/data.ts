import {
  buildCompositeSnapshot,
  buildMetricSnapshotsFromDefinitions,
  getMetrics,
  type CompositeSnapshot,
  type HistoryPoint,
  type MetricDefinition,
  type MetricSnapshot,
} from "@/lib/bubble";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

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

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return fallbackDashboardData();
  }

  const [{ data: metricRows, error: metricError }, { data: valueRows, error: valueError }] = await Promise.all([
    supabase.from("metrics").select("*").eq("active", true).order("category").order("name"),
    supabase.from("metric_values").select("metric_id,date,value").order("date"),
  ]);

  if (metricError || valueError || !metricRows?.length) {
    return fallbackDashboardData();
  }

  const valuesByMetric = new Map<string, HistoryPoint[]>();
  for (const row of (valueRows ?? []) as MetricValueRow[]) {
    const values = valuesByMetric.get(row.metric_id) ?? [];
    values.push({ date: row.date, value: Number(row.value) });
    valuesByMetric.set(row.metric_id, values);
  }

  const metrics = (metricRows as MetricRow[])
    .map((metric) => mapMetric(metric, valuesByMetric.get(metric.id) ?? []))
    .filter((metric) => metric.history.length > 0);

  if (!metrics.length) {
    return fallbackDashboardData();
  }

  const snapshots = buildMetricSnapshotsFromDefinitions(metrics);
  return {
    metrics,
    snapshots,
    composite: buildCompositeSnapshot(snapshots),
    fromSupabase: true,
  };
}

export async function getMetricDataBySlug(slug: string) {
  const data = await getDashboardData();
  const metric = data.metrics.find((entry) => entry.slug === slug) ?? null;
  const snapshot = data.snapshots.find((entry) => entry.metric.slug === slug) ?? null;
  return { ...data, metric, snapshot };
}
