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

// FRED discontinued all Wilshire index series (WILL5000IND, WILL5000PRFC, etc.) on
// June 3, 2024 due to a licensing change, so they 404 permanently. NCBEILQ027S
// (Fed Z.1 nonfinancial corporate equities, in millions) is used as the market-cap
// proxy instead. It excludes financial-sector equities, so it understates true
// total market cap by a roughly constant margin -- verified against independent
// Buffett Indicator trackers as within ~5-10 points of the reported figure for 2026.
async function fetchBuffettIndicator() {
  const [marketCap, gdp] = await Promise.all([fetchFredSeries("NCBEILQ027S"), fetchFredSeries("GDP")]);
  const gdpByDate = [...gdp].sort((left, right) => left.date.localeCompare(right.date));
  let gdpIndex = 0;
  return marketCap.map((point) => {
    while (gdpIndex + 1 < gdpByDate.length && gdpByDate[gdpIndex + 1].date <= point.date) {
      gdpIndex += 1;
    }
    const marketCapBillions = point.value / 1000;
    return {
      date: point.date,
      value: (marketCapBillions / gdpByDate[gdpIndex].value) * 100,
    };
  });
}

// Shiller doesn't publish a JSON/CSV feed for CAPE, only a legacy .xls file that
// would require a binary parser (the well-known npm "xlsx" package has an
// unpatched high-severity prototype-pollution advisory, so it's deliberately not
// used here). multpl.com publishes the same CAPE series as a plain HTML table,
// updated monthly, with an unrestrictive robots.txt -- parsed with a small regex
// instead of a full HTML-parsing dependency.
async function fetchShillerCape(): Promise<HistoryPoint[]> {
  const response = await fetch("https://www.multpl.com/shiller-pe/table/by-month");
  if (!response.ok) {
    throw new Error(`multpl shiller-pe failed with ${response.status}`);
  }
  const html = await response.text();
  const rowPattern = /<tr[^>]*>\s*<td>([^<]+)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g;
  const rows: HistoryPoint[] = [];
  let match: RegExpExecArray | null;
  while ((match = rowPattern.exec(html))) {
    const parsedDate = new Date(match[1].trim());
    const numberMatch = match[2].match(/\d+\.\d+/);
    if (Number.isNaN(parsedDate.getTime()) || !numberMatch) {
      continue;
    }
    const value = Number(numberMatch[0]);
    if (!Number.isFinite(value)) {
      continue;
    }
    rows.push({ date: parsedDate.toISOString().slice(0, 10), value });
  }
  if (!rows.length) {
    throw new Error("multpl shiller-pe table returned no rows.");
  }
  return rows;
}

// FRED's own "SP500" series only goes back to mid-2016 (S&P Dow Jones Indices
// only licenses the trailing ~10 years to FRED), so this only produces recent
// history -- fine for ongoing ingestion, which just appends new rows over time.
async function fetchSp500OverM2(): Promise<HistoryPoint[]> {
  const [sp500, m2] = await Promise.all([fetchFredSeries("SP500"), fetchFredSeries("M2SL")]);
  const m2ByDate = [...m2].sort((left, right) => left.date.localeCompare(right.date));
  let m2Index = 0;
  return sp500.map((point) => {
    while (m2Index + 1 < m2ByDate.length && m2ByDate[m2Index + 1].date <= point.date) {
      m2Index += 1;
    }
    return {
      date: point.date,
      value: point.value / m2ByDate[m2Index].value,
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

// Artificial Analysis's free-tier Data API (https://artificialanalysis.ai/data-api) is the only
// free, live source found for cross-model benchmark comparisons -- it requires a personal API
// key (sign up at artificialanalysis.ai, no cost for the free tier, 10 requests/day). If
// ARTIFICIALANALYSIS_API_KEY isn't configured, this source is skipped entirely rather than
// falling back to invented numbers, per the site's data-integrity rule.
async function fetchOpenWeightGap(): Promise<HistoryPoint[]> {
  const apiKey = process.env.ARTIFICIALANALYSIS_API_KEY;
  if (!apiKey) {
    throw new Error("ARTIFICIALANALYSIS_API_KEY is not configured; skipping open-weight gap update.");
  }
  const response = await fetch("https://artificialanalysis.ai/api/v2/language/models", {
    headers: { "x-api-key": apiKey },
  });
  if (!response.ok) {
    throw new Error(`Artificial Analysis API failed with ${response.status}`);
  }
  const payload = (await response.json()) as {
    data?: Array<{
      intelligence_index?: number | null;
      evaluations?: { artificial_analysis_intelligence_index?: number | null } | null;
      license?: string | null;
      open_weights?: boolean | null;
    }>;
  };
  const models = payload.data ?? [];
  if (!models.length) {
    throw new Error("Artificial Analysis API returned no models.");
  }

  let topOpenScore = -Infinity;
  let topClosedScore = -Infinity;
  for (const model of models) {
    const score = model.intelligence_index ?? model.evaluations?.artificial_analysis_intelligence_index ?? null;
    if (score === null || score === undefined) {
      continue;
    }
    const isOpenWeight = model.open_weights === true || /open/i.test(model.license ?? "");
    if (isOpenWeight) {
      topOpenScore = Math.max(topOpenScore, score);
    } else {
      topClosedScore = Math.max(topClosedScore, score);
    }
  }
  if (!Number.isFinite(topOpenScore) || !Number.isFinite(topClosedScore)) {
    throw new Error("Could not identify both an open-weight and a closed top model in the Artificial Analysis response.");
  }

  return [{ date: new Date().toISOString().slice(0, 10), value: Number((topClosedScore - topOpenScore).toFixed(1)) }];
}

type XbrlFact = { start?: string; end: string; val: number; form: string; filed: string };

const hyperscalerCiks = [
  "0000789019", // Microsoft
  "0001018724", // Amazon
  "0001652044", // Alphabet
  "0001326801", // Meta Platforms
];

// SEC's fair-access policy requires a descriptive User-Agent identifying the requester; it does
// not require an API key. See https://www.sec.gov/os/webmaster-faq#developers.
const SEC_USER_AGENT = "BubbleTrackerIngest/1.0 (+https://github.com/sath-commits/Bubble)";

async function fetchXbrlConcept(cik: string, tag: string): Promise<XbrlFact[] | null> {
  const response = await fetch(`https://data.sec.gov/api/xbrl/companyconcept/CIK${cik}/us-gaap/${tag}.json`, {
    headers: { "User-Agent": SEC_USER_AGENT, Accept: "application/json" },
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`SEC companyconcept ${cik}/${tag} failed with ${response.status}`);
  }
  const payload = (await response.json()) as { units?: { USD?: XbrlFact[] } };
  return payload.units?.USD ?? null;
}

// Large filers have used different XBRL tags for the same line item over the years (e.g. ASC 606
// adoption changed the standard revenue tag), so each concept is tried in priority order and the
// first tag that actually has data wins.
async function fetchXbrlConceptWithFallback(cik: string, tags: string[]): Promise<XbrlFact[]> {
  for (const tag of tags) {
    const facts = await fetchXbrlConcept(cik, tag);
    if (facts && facts.length) {
      return facts;
    }
  }
  throw new Error(`No usable XBRL facts for CIK ${cik} among tags: ${tags.join(", ")}`);
}

// Reduces a raw XBRL fact array to one value per full fiscal year (10-K filings with a
// ~365-day duration), keyed by the calendar year of the period end date, keeping the most
// recently filed figure when a period was restated.
function annualFactsByCalendarYear(facts: XbrlFact[]): Map<number, number> {
  const byPeriodEnd = new Map<string, XbrlFact>();
  for (const fact of facts) {
    if (fact.form !== "10-K" || !fact.start) {
      continue;
    }
    const durationDays = (new Date(fact.end).getTime() - new Date(fact.start).getTime()) / 86_400_000;
    if (durationDays < 350 || durationDays > 380) {
      continue;
    }
    const existing = byPeriodEnd.get(fact.end);
    if (!existing || fact.filed > existing.filed) {
      byPeriodEnd.set(fact.end, fact);
    }
  }
  const byYear = new Map<number, number>();
  for (const fact of byPeriodEnd.values()) {
    byYear.set(new Date(fact.end).getUTCFullYear(), fact.val);
  }
  return byYear;
}

const revenueXbrlTags = ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues"];
const capexXbrlTags = ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets"];

// Microsoft, Amazon, Alphabet, and Meta don't share a fiscal year end (Microsoft's is June 30;
// the other three are calendar years), so combining "by fiscal year" would misalign them. This
// buckets each company's annual figure by the calendar year its fiscal year ends in instead --
// an approximation that's disclosed in the metric's caveats.
async function fetchHyperscalerCapexDivergence(): Promise<HistoryPoint[]> {
  const revenueByCompany = await Promise.all(
    hyperscalerCiks.map((cik) => fetchXbrlConceptWithFallback(cik, revenueXbrlTags).then(annualFactsByCalendarYear)),
  );
  const capexByCompany = await Promise.all(
    hyperscalerCiks.map((cik) => fetchXbrlConceptWithFallback(cik, capexXbrlTags).then(annualFactsByCalendarYear)),
  );

  const years = new Set<number>();
  for (const byYear of [...revenueByCompany, ...capexByCompany]) {
    for (const year of byYear.keys()) {
      years.add(year);
    }
  }

  const combinedRevenue = new Map<number, number>();
  const combinedCapex = new Map<number, number>();
  for (const year of years) {
    if (revenueByCompany.every((byYear) => byYear.has(year))) {
      combinedRevenue.set(year, revenueByCompany.reduce((sum, byYear) => sum + (byYear.get(year) ?? 0), 0));
    }
    if (capexByCompany.every((byYear) => byYear.has(year))) {
      combinedCapex.set(year, capexByCompany.reduce((sum, byYear) => sum + (byYear.get(year) ?? 0), 0));
    }
  }

  const points: HistoryPoint[] = [];
  for (const year of [...years].sort((a, b) => a - b)) {
    const revenue = combinedRevenue.get(year);
    const revenuePrior = combinedRevenue.get(year - 1);
    const capex = combinedCapex.get(year);
    const capexPrior = combinedCapex.get(year - 1);
    if (!revenue || !revenuePrior || !capex || !capexPrior) {
      continue;
    }
    const revenueGrowthPct = ((revenue - revenuePrior) / revenuePrior) * 100;
    const capexGrowthPct = ((capex - capexPrior) / capexPrior) * 100;
    points.push({ date: `${year}-12-31`, value: Number((capexGrowthPct - revenueGrowthPct).toFixed(1)) });
  }
  if (!points.length) {
    throw new Error("Could not compute any complete-year hyperscaler capex/revenue divergence points.");
  }
  return points;
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
    await upsertValues(supabase, "buffett", points, { source: "FRED", series: ["NCBEILQ027S", "GDP"], derived: true });
    sourceResults.push({ source: "buffett-derived", ok: true, count: points.length });
  } catch (error) {
    sourceResults.push({ source: "buffett-derived", ok: false, error: error instanceof Error ? error.message : String(error) });
  }

  try {
    const points = await fetchShillerCape();
    await upsertValues(supabase, "cape", points, { source: "multpl.com", endpoint: "/shiller-pe/table/by-month" });
    sourceResults.push({ source: "multpl-shiller-cape", ok: true, count: points.length });
  } catch (error) {
    sourceResults.push({ source: "multpl-shiller-cape", ok: false, error: error instanceof Error ? error.message : String(error) });
  }

  try {
    const points = await fetchSp500OverM2();
    await upsertValues(supabase, "sp500-m2", points, { source: "FRED", series: ["SP500", "M2SL"], derived: true });
    sourceResults.push({ source: "sp500-m2-derived", ok: true, count: points.length });
  } catch (error) {
    sourceResults.push({ source: "sp500-m2-derived", ok: false, error: error instanceof Error ? error.message : String(error) });
  }

  try {
    const points = await fetchCryptoSpeculation();
    await upsertValues(supabase, "crypto-speculation", points, { source: "CoinGecko", endpoint: "/global" });
    sourceResults.push({ source: "coingecko-global", ok: true, count: points.length });
  } catch (error) {
    sourceResults.push({ source: "coingecko-global", ok: false, error: error instanceof Error ? error.message : String(error) });
  }

  try {
    const points = await fetchHyperscalerCapexDivergence();
    await upsertValues(supabase, "hyperscaler-capex-divergence", points, {
      source: "SEC EDGAR XBRL",
      ciks: hyperscalerCiks,
      derived: true,
    });
    sourceResults.push({ source: "sec-edgar-hyperscaler-capex-divergence", ok: true, count: points.length });
  } catch (error) {
    sourceResults.push({
      source: "sec-edgar-hyperscaler-capex-divergence",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    const points = await fetchOpenWeightGap();
    await upsertValues(supabase, "open-weight-gap", points, { source: "Artificial Analysis API" });
    sourceResults.push({ source: "artificial-analysis-open-weight-gap", ok: true, count: points.length });
  } catch (error) {
    sourceResults.push({
      source: "artificial-analysis-open-weight-gap",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
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
