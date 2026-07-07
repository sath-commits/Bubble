"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MetricDefinition } from "@/lib/bubble";

function toTs(date: string) {
  return new Date(date).getTime();
}

function buildReferenceBands(metric: MetricDefinition) {
  const firstTs = toTs(metric.history[0].date);
  const lastTs = toTs(metric.history[metric.history.length - 1].date);
  return [
    { label: "Dot-com", start: "2000-01-01", end: "2002-01-01" },
    { label: "GFC", start: "2007-01-01", end: "2009-01-01" },
    { label: "COVID", start: "2020-02-01", end: "2020-03-31" },
    { label: "2022 bear", start: "2022-01-01", end: "2022-10-01" },
  ]
    .map((band) => ({ label: band.label, start: toTs(band.start), end: toTs(band.end) }))
    .filter((band) => band.end >= firstTs && band.start <= lastTs);
}

function formatTooltipValue(value: number, metric: MetricDefinition) {
  const rounded = Number(value).toFixed(metric.unit === "%" ? 1 : 2);
  if (metric.unit === "%") {
    return `${rounded}%`;
  }
  if (metric.unit === "x") {
    return `${rounded}x`;
  }
  if (metric.unit === "$T") {
    return `$${rounded}T`;
  }
  return rounded;
}

export function MetricChart({ metric, compact = false }: { metric: MetricDefinition; compact?: boolean }) {
  const [scaleMode, setScaleMode] = useState<"linear" | "log">("linear");
  const bands = useMemo(() => buildReferenceBands(metric), [metric]);
  const latest = metric.history[metric.history.length - 1];
  const visibleData = useMemo(
    () => metric.history.map((point) => ({ ...point, ts: toTs(point.date) })),
    [metric.history],
  );

  const isLogScaleSupported = metric.history.every((point) => point.value > 0);

  return (
    <div className="rounded-lg border border-[#e5ddd3] bg-white p-3">
      <div className={compact ? "sr-only" : "mb-2 flex items-center justify-between gap-3"}>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-[#9e9087]">Historical context</p>
          <p className="text-xs text-[#6e5f52]">Red bands mark major stress windows.</p>
        </div>
        <div className="flex items-center gap-2">
          {isLogScaleSupported ? (
            <button
              type="button"
              onClick={() => setScaleMode(scaleMode === "linear" ? "log" : "linear")}
              className="rounded border border-[#d4c9bc] bg-white px-2 py-1 text-[10px] font-medium text-[#4a3d33]"
            >
              {scaleMode === "linear" ? "Log" : "Linear"}
            </button>
          ) : null}
        </div>
      </div>
      <div className={compact ? "h-28" : "h-72"}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visibleData}>
            <CartesianGrid vertical={false} stroke="#f0e7da" strokeDasharray="4 4" />
            <XAxis
              dataKey="ts"
              type="number"
              domain={["dataMin", "dataMax"]}
              hide={compact}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#6e5f52" }}
              tickFormatter={(ts) => new Date(ts).toLocaleDateString("en-US", { year: "numeric", timeZone: "UTC" })}
            />
            <YAxis
              scale={isLogScaleSupported && scaleMode === "log" ? "log" : "linear"}
              hide={compact}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#6e5f52" }}
              width={56}
            />
            <Tooltip
              formatter={(value) => formatTooltipValue(Number(value), metric)}
              labelFormatter={(label) => new Date(label).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })}
            />
            {bands.map((band) => (
              <ReferenceArea
                key={band.label}
                x1={band.start}
                x2={band.end}
                fill="#ef4444"
                fillOpacity={0.16}
                stroke="#b91c1c"
                strokeOpacity={0.5}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            ))}
            <Line type="monotone" dataKey="value" stroke="#1c1612" strokeWidth={2.5} dot={false} />
            {!compact ? (
              <ReferenceDot
                x={toTs(latest.date)}
                y={latest.value}
                r={5}
                fill="#da7756"
                stroke="white"
                label={{ value: "Current", position: "top", fill: "#4a3d33", fontSize: 11 }}
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className={compact ? "mt-2 flex flex-wrap gap-1" : "mt-4 flex flex-wrap gap-2 text-xs text-[#6e5f52]"}>
        {bands.map((band) => (
          <span
            key={band.label}
            className={
              compact
                ? "rounded-full border border-[#d4c9bc] bg-white px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[#6e5f52]"
                : "rounded-full border border-[#d4c9bc] bg-white px-2.5 py-1 text-[10px] uppercase tracking-wide text-[#6e5f52]"
            }
          >
            {band.label}
          </span>
        ))}
      </div>
    </div>
  );
}
