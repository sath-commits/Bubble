import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  buildCompositeSnapshot,
  buildMetricSnapshotsFromDefinitions,
  getMetrics,
  type HistoryPoint,
  type MetricDefinition,
} from "../src/lib/bubble";
import type { Database, Json } from "../src/lib/supabase/database.types";

type SourceResult = {
  source: string;
  ok: boolean;
  count?: number;
  error?: string;
};

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

type AlertRow = {
  id: string;
  user_id: string;
  target_type: "composite" | "metric" | "distance_to_peak";
  metric_id: string | null;
  operator: ">=" | "<=" | "crosses";
  threshold: number | string;
  last_triggered_at: string | null;
};

const fredSeriesByMetric: Record<string, string> = {
  "yield-curve": "T10Y2Y",
  "yield-curve-3m": "T10Y3M",
  vix: "VIXCLS",
  "credit-spread": "BAMLH0A0HYM2",
  "investment-grade-oas": "BAMLC0A0CM",
  "ten-year-yield": "DGS10",
  unemployment: "UNRATE",
  "sahm-rule": "SAHMREALTIME",
};

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function metricToRow(metric: MetricDefinition) {
  return {
    id: metric.id,
    slug: metric.slug,
    name: metric.name,
    category: metric.category,
    unit: metric.unit,
    orientation_higher_is_frothier: metric.orientationHigherIsFrothier,
    description_short: metric.descriptionShort,
    description_long: metric.descriptionLong,
    why_it_matters: metric.whyItMatters,
    source_name: metric.sourceName,
    source_url: metric.sourceUrl,
    source_tier: 1,
    update_frequency: metric.updateFrequency,
    caveats: metric.caveats,
    included_in_composite: metric.includedInComposite,
    active: true,
  };
}

function parseFredCsv(csv: string, series: string): HistoryPoint[] {
  const lines = csv.trim().split(/\r?\n/);
  const rows: HistoryPoint[] = [];
  for (const line of lines.slice(1)) {
    const [date, rawValue] = line.split(",");
    if (!date || !rawValue || rawValue === ".") {
      continue;
    }
    const value = Number(rawValue);
    if (Number.isFinite(value)) {
      rows.push({ date, value });
    }
  }
  if (!rows.length) {
    throw new Error(`FRED ${series} returned no numeric rows.`);
  }
  return rows;
}

async function fetchFredSeries(series: string) {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${series}&observation_start=1998-01-01`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FRED ${series} failed with ${response.status}`);
  }
  return parseFredCsv(await response.text(), series);
}

async function fetchBuffettIndicator() {
  const [marketCap, gdp] = await Promise.all([fetchFredSeries("WILL5000PRFC"), fetchFredSeries("GDP")]);
  const gdpByDate = [...gdp].sort((left, right) => left.date.localeCompare(right.date));
  let gdpIndex = 0;
  return marketCap.map((point) => {
    while (gdpIndex + 1 < gdpByDate.length && gdpByDate[gdpIndex + 1].date <= point.date) {
      gdpIndex += 1;
    }
    return {
      date: point.date,
      value: (point.value / gdpByDate[gdpIndex].value) * 100,
    };
  });
}

async function fetchCryptoSpeculation() {
  const response = await fetch("https://api.coingecko.com/api/v3/global");
  if (!response.ok) {
    throw new Error(`CoinGecko global failed with ${response.status}`);
  }
  const payload = (await response.json()) as { data?: { total_market_cap?: { usd?: number } } };
  const totalMarketCap = payload.data?.total_market_cap?.usd;
  if (!totalMarketCap) {
    throw new Error("CoinGecko response did not include total market cap.");
  }
  return [{ date: new Date().toISOString().slice(0, 10), value: totalMarketCap / 1_000_000_000_000 }];
}

async function upsertValues(
  supabase: SupabaseClient<Database>,
  metricId: string,
  points: HistoryPoint[],
  sourceDetails: Json,
) {
  const rows = points.map((point) => ({
    metric_id: metricId,
    date: point.date,
    value: point.value,
    is_estimate: false,
    source_details: sourceDetails,
  }));
  const { error } = await supabase.from("metric_values").upsert(rows, { onConflict: "metric_id,date" });
  if (error) {
    throw error;
  }
}

function mapMetric(row: MetricRow, history: HistoryPoint[]): MetricDefinition {
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
    history,
  };
}

function thresholdBreached(current: number, operator: AlertRow["operator"], threshold: number) {
  if (operator === "<=") {
    return current <= threshold;
  }
  return current >= threshold;
}

async function recomputeCompositeAndAlerts(supabase: SupabaseClient<Database>) {
  const [{ data: metricRows, error: metricError }, { data: valueRows, error: valueError }] = await Promise.all([
    supabase.from("metrics").select("*").eq("active", true),
    supabase.from("metric_values").select("metric_id,date,value").order("date"),
  ]);
  if (metricError || valueError) {
    throw metricError ?? valueError;
  }

  const valuesByMetric = new Map<string, HistoryPoint[]>();
  for (const row of (valueRows ?? []) as { metric_id: string; date: string; value: number | string }[]) {
    const values = valuesByMetric.get(row.metric_id) ?? [];
    values.push({ date: row.date, value: Number(row.value) });
    valuesByMetric.set(row.metric_id, values);
  }

  const metrics = ((metricRows ?? []) as MetricRow[])
    .map((metric) => mapMetric(metric, valuesByMetric.get(metric.id) ?? []))
    .filter((metric) => metric.history.length > 0);
  const snapshots = buildMetricSnapshotsFromDefinitions(metrics);
  const composite = buildCompositeSnapshot(snapshots);
  const latestDate = snapshots.map((snapshot) => snapshot.latestDate).sort().at(-1);
  if (!latestDate) {
    throw new Error("No latest date available for composite.");
  }

  const { error: compositeError } = await supabase.from("composite_scores").upsert(
    {
      date: latestDate,
      score: composite.score,
      breakdown: {
        categoryScores: composite.categoryScores,
        topDrivers: composite.topDrivers.map((driver) => ({
          metricId: driver.metric.id,
          subscore: driver.subscore,
          distanceToPeak: driver.distanceToPeak,
        })),
      },
    },
    { onConflict: "date" },
  );
  if (compositeError) {
    throw compositeError;
  }

  const { data: alerts, error: alertsError } = await supabase.from("user_alerts").select("*").eq("active", true);
  if (alertsError) {
    throw alertsError;
  }

  for (const alert of (alerts ?? []) as AlertRow[]) {
    const threshold = Number(alert.threshold);
    const metricSnapshot = alert.metric_id ? snapshots.find((snapshot) => snapshot.metric.id === alert.metric_id) : null;
    let current: number | null = null;
    if (alert.target_type === "composite") {
      current = composite.score;
    } else if (alert.target_type === "metric") {
      current = metricSnapshot?.currentValue ?? null;
    } else if (alert.target_type === "distance_to_peak") {
      current = metricSnapshot?.distanceToPeak ?? null;
    }
    if (current === null || !thresholdBreached(current, alert.operator, threshold)) {
      continue;
    }
    const lastTriggeredDate = alert.last_triggered_at?.slice(0, 10);
    if (lastTriggeredDate === latestDate) {
      continue;
    }
    const targetName = metricSnapshot?.metric.name ?? "Composite bubble score";
    const { error: notificationError } = await supabase.from("user_notifications").insert({
      user_id: alert.user_id,
      alert_id: alert.id,
      title: `${targetName} alert triggered`,
      body: `${targetName} is now ${Number(current.toFixed(2))}, crossing your ${alert.operator} ${threshold} reminder. This is your user-defined reminder, not a recommendation.`,
      triggered_on: latestDate,
    });
    if (notificationError) {
      throw notificationError;
    }
    const { error: updateError } = await supabase
      .from("user_alerts")
      .update({ last_triggered_at: new Date().toISOString() })
      .eq("id", alert.id);
    if (updateError) {
      throw updateError;
    }
  }
}

async function main() {
  const supabase = getSupabase();
  const sourceResults: SourceResult[] = [];

  const { error: metricError } = await supabase.from("metrics").upsert(getMetrics().map(metricToRow), { onConflict: "id" });
  if (metricError) {
    throw metricError;
  }

  for (const [metricId, fredSeries] of Object.entries(fredSeriesByMetric)) {
    try {
      const points = await fetchFredSeries(fredSeries);
      await upsertValues(supabase, metricId, points, { source: "FRED", series: fredSeries });
      sourceResults.push({ source: fredSeries, ok: true, count: points.length });
    } catch (error) {
      sourceResults.push({ source: fredSeries, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }

  try {
    const points = await fetchBuffettIndicator();
    await upsertValues(supabase, "buffett", points, { source: "FRED", series: ["WILL5000PRFC", "GDP"], derived: true });
    sourceResults.push({ source: "buffett-derived", ok: true, count: points.length });
  } catch (error) {
    sourceResults.push({ source: "buffett-derived", ok: false, error: error instanceof Error ? error.message : String(error) });
  }

  try {
    const points = await fetchCryptoSpeculation();
    await upsertValues(supabase, "crypto-speculation", points, { source: "CoinGecko", endpoint: "/global" });
    sourceResults.push({ source: "coingecko-global", ok: true, count: points.length });
  } catch (error) {
    sourceResults.push({ source: "coingecko-global", ok: false, error: error instanceof Error ? error.message : String(error) });
  }

  await recomputeCompositeAndAlerts(supabase);

  const failed = sourceResults.filter((result) => !result.ok);
  const { error: logError } = await supabase.from("ingestion_runs").insert({
    status: failed.length === 0 ? "success" : failed.length === sourceResults.length ? "failed" : "partial",
    source_details: { sources: sourceResults },
  });
  if (logError) {
    throw logError;
  }

  console.log(JSON.stringify({ status: failed.length ? "partial" : "success", sources: sourceResults }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
