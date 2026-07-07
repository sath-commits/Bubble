import { createClient } from "@supabase/supabase-js";
import { buildCompositeSnapshot, buildMetricSnapshots, getMetrics } from "../src/lib/bubble";
import type { Database } from "../src/lib/supabase/database.types";

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function main() {
  const supabase = getSupabase();
  const metrics = getMetrics();

  const metricRows = metrics.map((metric) => ({
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
    manual_entry: false,
  }));

  const { error: metricsError } = await supabase.from("metrics").upsert(metricRows, { onConflict: "id" });
  if (metricsError) {
    throw metricsError;
  }

  for (const metric of metrics) {
    const rows = metric.history.map((point) => ({
      metric_id: metric.id,
      date: point.date,
      value: point.value,
      is_estimate: false,
      source_details: { seed: "static-catalog" },
    }));
    const { error } = await supabase.from("metric_values").upsert(rows, { onConflict: "metric_id,date" });
    if (error) {
      throw error;
    }
  }

  const snapshots = buildMetricSnapshots();
  const composite = buildCompositeSnapshot(snapshots);
  const latestDate = snapshots.map((snapshot) => snapshot.latestDate).sort().at(-1);
  if (latestDate) {
    const { error } = await supabase.from("composite_scores").upsert(
      {
        date: latestDate,
        score: composite.score,
        breakdown: {
          categoryScores: composite.categoryScores,
          topDrivers: composite.topDrivers.map((driver) => ({
            metricId: driver.metric.id,
            subscore: driver.subscore,
          })),
        },
      },
      { onConflict: "date" },
    );
    if (error) {
      throw error;
    }
  }

  console.log(`Seeded ${metrics.length} metrics and ${metrics.reduce((total, metric) => total + metric.history.length, 0)} values.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
