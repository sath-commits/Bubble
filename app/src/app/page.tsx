import Link from "next/link";
import { ArrowRight, BarChart3, Compass, ShieldCheck, Sparkles } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { ShareButton } from "@/components/share-button";
import { buildAggregateInterpretation, formatDate } from "@/lib/bubble";
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
  const hotMetrics = featuredMetrics.filter((snapshot) => snapshot.subscore >= 70);
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
            <h1 className="mt-2 text-xl font-semibold text-[#1c1612] sm:text-2xl">Where are we right now?</h1>
            <p className="mt-2 text-sm leading-7 text-[#4a3d33]">
              Tracks US equity markets only through a transparent composite score and plain-language context, not a prediction engine.
            </p>
            <p className="mt-3 rounded-lg border border-[#e5ddd3] bg-[#f0ebe1] px-3 py-3 text-sm leading-7 text-[#4a3d33]">
              {composite.summary}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/learn" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500">
                <Compass className="h-3.5 w-3.5" />
                Bubbles that built the future
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/about" className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4c9bc] bg-white px-3 py-2 text-xs font-medium text-[#4a3d33] hover:bg-[#ede8df]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Learn the methodology
              </Link>
            </div>
            <p className="mt-3 text-xs leading-6 text-[#6e5f52]">
              Educational only. The composite is a heuristic snapshot of valuation and sentiment extremes, not a trading signal.
            </p>
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
        <div className="grid grid-cols-2 gap-3 px-4 py-4 sm:grid-cols-4 sm:px-5">
          <div className="rounded-lg border border-[#e5ddd3] bg-white px-3 py-3">
            <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">Status</div>
            <div className="mt-1 text-xl font-bold text-[#1c1612]">{composite.zone}</div>
            <div className="mt-0.5 text-[10px] text-[#b8ad9e]">Composite state</div>
          </div>
          <div className="rounded-lg border border-[#e5ddd3] bg-white px-3 py-3">
            <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">Leading signals</div>
            <div className="mt-1 text-xl font-bold text-[#1c1612]">{hotMetrics.length}</div>
            <div className="mt-0.5 text-[10px] text-[#b8ad9e]">Hot metrics</div>
          </div>
          <div className="rounded-lg border border-[#e5ddd3] bg-white px-3 py-3">
            <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">Scope</div>
            <div className="mt-1 text-xl font-bold text-[#1c1612]">US</div>
            <div className="mt-0.5 text-[10px] text-[#b8ad9e]">Single-market view</div>
          </div>
          <div className="rounded-lg border border-[#e5ddd3] bg-white px-3 py-3">
            <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">Read</div>
            <div className="mt-1 text-xl font-bold text-[#1c1612]">Plain</div>
            <div className="mt-0.5 text-[10px] text-[#b8ad9e]">Not a timing tool</div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {orderedSnapshots.map((snapshot) => (
          <MetricCard key={snapshot.metric.id} snapshot={snapshot} />
        ))}
      </section>

      <section className="rounded-xl border border-[#e5ddd3] bg-white px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">Context</div>
            <h2 className="mt-1 text-base font-semibold text-[#1c1612]">What this is telling us now</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#4a3d33]">
              The dashboard leads with the composite meter and the plain-language readout, then backs it up with charted evidence and the underlying metric definitions.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {Object.entries(composite.categoryScores).map(([category, score]) => (
                <div key={category} className="rounded-lg border border-[#e5ddd3] bg-[#f7f2eb] px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">{category}</div>
                  <div className="mt-1 text-lg font-bold text-[#1c1612]">{Math.round(score)}</div>
                </div>
              ))}
            </div>
          </div>
          <Link href="/sources" className="text-sm font-semibold text-[#da7756]">
            View data sources →
          </Link>
        </div>
      </section>
    </main>
  );
}
