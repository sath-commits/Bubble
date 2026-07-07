import { notFound } from "next/navigation";
import { MetricChart } from "@/components/metric-chart";
import {
  disclaimerCopy,
  formatDate,
  formatValue,
  getMetrics,
} from "@/lib/bubble";
import { getMetricDataBySlug } from "@/lib/data";

export function generateStaticParams() {
  return getMetrics().map((metric) => ({ slug: metric.slug }));
}

export default async function MetricDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { metric, snapshot, composite } = await getMetricDataBySlug(slug);

  if (!metric) {
    notFound();
  }
  if (!snapshot) {
    notFound();
  }
  const contribution = composite.categoryScores[metric.category];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-5">
      <div className="rounded-xl border border-[#e5ddd3] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">Metric detail</div>
            <h1 className="mt-2 text-xl font-semibold text-[#1c1612]">{metric.name}</h1>
            <p className="mt-2 text-sm leading-7 text-[#4a3d33]">{metric.descriptionShort}</p>
            <p className="mt-3 rounded-lg border border-[#e5ddd3] bg-[#f0ebe1] p-3 text-sm leading-7 text-[#4a3d33]">
              {snapshot.currentRead}
            </p>
          </div>
          <div className="rounded-lg border border-[#e5ddd3] bg-[#f7f2eb] p-4">
            <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">Current reading</div>
            <p className="mt-2 text-2xl font-bold text-[#1c1612]">{formatValue(snapshot.currentValue, metric)}</p>
            <p className="mt-2 text-sm text-[#4a3d33]">
              {snapshot.percentile}th percentile • {snapshot.distanceToPeak}% of the way to its prior froth peak
            </p>
          </div>
        </div>
      </div>

      <MetricChart metric={metric} />

      <div className="grid gap-4 sm:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <h2 className="text-base font-semibold text-[#1c1612]">What this metric is telling us now</h2>
          <p className="mt-3 text-sm leading-7 text-[#4a3d33]">{metric.descriptionLong}</p>
          <div className="mt-4 rounded-lg border border-[#e5ddd3] bg-[#f0ebe1] p-3 text-sm leading-7 text-[#4a3d33]">
            <p className="font-semibold text-[#1c1612]">Why it matters</p>
            <p className="mt-2">{metric.whyItMatters}</p>
          </div>
        </section>
        <section className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <h2 className="text-base font-semibold text-[#1c1612]">Source and caveats</h2>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-[#4a3d33]">
            <li><span className="font-semibold text-[#1c1612]">Source:</span> <a href={metric.sourceUrl} className="text-[#da7756]" target="_blank" rel="noreferrer">{metric.sourceName}</a></li>
            <li><span className="font-semibold text-[#1c1612]">Update frequency:</span> {metric.updateFrequency}</li>
            <li><span className="font-semibold text-[#1c1612]">Last updated:</span> {formatDate(snapshot.latestDate)}</li>
            <li><span className="font-semibold text-[#1c1612]">Composite contribution:</span> {metric.includedInComposite ? `${Math.round(snapshot.subscore)} subscore in ${metric.category}; category score ${contribution}.` : "Context only; not included in the composite."}</li>
            <li><span className="font-semibold text-[#1c1612]">Caveats:</span> {metric.caveats}</li>
          </ul>
        </section>
      </div>
      <section className="rounded-xl border border-[#e5ddd3] bg-white p-4 text-sm leading-7 text-[#4a3d33]">
        <h2 className="text-base font-semibold text-[#1c1612]">Methodology note</h2>
        <p className="mt-2">
          Each metric is oriented so higher means frothier, converted to a percentile against its own history, and then averaged within its category before the category scores are averaged into the composite.
        </p>
        <p className="mt-3 text-xs leading-6 text-[#6e5f52]">{disclaimerCopy.investment}</p>
      </section>
    </main>
  );
}
