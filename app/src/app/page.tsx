import { BarChart3, Sparkles } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { ShareButton } from "@/components/share-button";
import { buildAggregateInterpretation, formatDate, ZONES } from "@/lib/bubble";
import { getDashboardData } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const { snapshots, composite, fromSupabase } = await getDashboardData();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const { data: watchlist } = supabase && user
    ? await supabase.from("user_watchlist").select("metric_id").eq("user_id", user.id)
    : { data: [] };
  const pinnedMetricIds = new Set(((watchlist ?? []) as { metric_id: string }[]).map((row) => row.metric_id));
  const orderedSnapshots = snapshots.slice().sort((left, right) => {
    const leftPinned = pinnedMetricIds.has(left.metric.id) ? 0 : 1;
    const rightPinned = pinnedMetricIds.has(right.metric.id) ? 0 : 1;
    return leftPinned - rightPinned;
  });
  const featuredMetrics = snapshots.filter((snapshot) => snapshot.metric.includedInComposite);
  const latestDate = snapshots
    .map((snapshot) => snapshot.latestDate)
    .sort()
    .at(-1) ?? snapshots[0].latestDate;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-5">
      <section className="overflow-hidden rounded-xl border border-[#e5ddd3] bg-white">
        <div className="grid gap-4 border-b border-[#e5ddd3] px-4 py-4 sm:grid-cols-[1.4fr_0.8fr] sm:px-5 sm:py-5">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-[#9e9087]">
              <Sparkles className="h-3.5 w-3.5 text-[#da7756]" />
              <span>US markets only • educational view • {fromSupabase ? "live data" : "static fallback"}</span>
            </div>
            <p className="mt-2 rounded-lg border border-[#e5ddd3] bg-[#f0ebe1] px-3 py-3 text-sm leading-7 text-[#4a3d33]">
              {composite.summary}
            </p>
            <p className="mt-3 text-xs leading-6 text-[#6e5f52]">
              Educational only. The composite is a heuristic snapshot of valuation and sentiment extremes, not a trading signal.
            </p>
            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">Bubble stages</div>
              <div className="relative mt-3">
                <div className="flex overflow-hidden rounded-full">
                  {ZONES.map((zone) => (
                    <div key={zone.label} className={`h-2 flex-1 bg-gradient-to-r ${zone.color}`} />
                  ))}
                </div>
                <div
                  className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#1c1612] shadow"
                  style={{ left: `${composite.score}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ZONES.map((zone) => {
                  const active = zone.label === composite.zone;
                  return (
                    <span
                      key={zone.label}
                      className={
                        active
                          ? "rounded-full border border-[#da7756] bg-[#da7756] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white"
                          : "rounded-full border border-[#d4c9bc] bg-white px-2 py-0.5 text-[9px] uppercase tracking-wide text-[#9e9087]"
                      }
                    >
                      {zone.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-[#e5ddd3] bg-[#f7f2eb] p-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-[#9e9087]">
              <BarChart3 className="h-3.5 w-3.5 text-[#da7756]" />
              <span>Composite</span>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div
                className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full border border-[#e5ddd3]"
                style={{ background: `conic-gradient(#da7756 ${composite.score}%, #e5ddd3 0)` }}
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-bold text-[#1c1612]">
                  {composite.score}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">Bubble score</div>
                <div className="mt-1 text-sm font-semibold text-[#4a3d33]">{composite.zone}</div>
                <div className="mt-1 text-[10px] text-[#b8ad9e]">0-100 heuristic meter</div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-7 text-[#4a3d33]">
              {buildAggregateInterpretation(featuredMetrics)}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-[#e5ddd3] pt-3 text-[10px] uppercase tracking-wide text-[#9e9087]">
              <span>Latest data {formatDate(latestDate)}</span>
              <ShareButton />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {orderedSnapshots.map((snapshot) => (
          <MetricCard key={snapshot.metric.id} snapshot={snapshot} />
        ))}
      </section>
    </main>
  );
}
