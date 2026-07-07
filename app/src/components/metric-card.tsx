import Link from "next/link";
import { ArrowRight, Activity, TrendingUp } from "lucide-react";
import type { MetricSnapshot } from "@/lib/bubble";
import { MetricChart } from "@/components/metric-chart";
import { formatDate, formatValue } from "@/lib/bubble";

function resolveStatus(subscore: number) {
  if (subscore >= 80) {
    return { label: "Bubble bath", className: "border-red-400 bg-red-50 text-red-600" };
  }
  if (subscore >= 60) {
    return { label: "Frothy", className: "border-amber-400 bg-amber-50 text-amber-700" };
  }
  if (subscore >= 40) {
    return { label: "Getting warm", className: "border-amber-400 bg-amber-50 text-amber-700" };
  }
  return { label: "Cooler", className: "border-emerald-400 bg-emerald-50 text-emerald-700" };
}

export function MetricCard({ snapshot }: { snapshot: MetricSnapshot }) {
  const { metric, subscore, percentile, currentRead } = snapshot;
  const status = resolveStatus(subscore);

  return (
    <Link href={`/metric/${metric.slug}`} className="group rounded-xl border border-[#e5ddd3] bg-white p-4 transition-colors hover:bg-[#ede8df]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[#9e9087]">
            <Activity className="h-3 w-3 text-[#da7756]" />
            <span>{metric.category}</span>
          </div>
          <p className="mt-1 text-base font-semibold text-[#1c1612]">{metric.name}</p>
          <p className="mt-1 text-sm text-[#4a3d33]">{metric.descriptionShort}</p>
          <p className="mt-1.5 text-xs leading-5 text-[#6e5f52]">{metric.whyItMatters}</p>
        </div>
        <div className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.className}`}>
          {status.label}
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-[#e5ddd3] bg-[#f7f2eb] p-3">
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-bold text-[#1c1612]">{formatValue(snapshot.currentValue, metric)}</p>
          <p className="text-[10px] uppercase tracking-wide text-[#9e9087]">{metric.sourceName}</p>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-[#4a3d33]">
          <TrendingUp className="h-3.5 w-3.5 text-[#da7756]" />
          <span>{currentRead}</span>
        </p>
        <p className="mt-2 text-[10px] text-[#b8ad9e]">
          {percentile}th percentile • {metric.updateFrequency} • updated {formatDate(snapshot.latestDate)}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-wide text-[#9e9087]">
        <span>{metric.includedInComposite ? `${Math.round(subscore)} composite subscore` : "Context metric"}</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </div>
      <div className="mt-3">
        <MetricChart metric={metric} compact />
      </div>
    </Link>
  );
}
