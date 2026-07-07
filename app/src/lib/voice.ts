import type { MetricDefinition, MetricSnapshot } from "./bubble";

export function buildCurrentRead(metric: MetricDefinition, snapshot: MetricSnapshot) {
  const percentile = snapshot.percentile;
  const startYear = new Date(metric.history[0].date).getFullYear();
  let tail = "running near the middle of the historical range";

  if (percentile >= 90) {
    tail = "near the top of its historical range";
  } else if (percentile >= 75) {
    tail = "warmer than most prior readings";
  } else if (percentile <= 25) {
    tail = "below historical norms";
  }

  return `${metric.name} is at the ${percentile}th percentile since ${startYear}, ${tail}.`;
}

export function buildHeroSentence(score: number, topDrivers: MetricSnapshot[]) {
  const names = topDrivers.map((driver) => driver.metric.name).join(", ");
  return `The market is in ${score >= 80 ? "bubble-bath" : score >= 60 ? "frothy" : score >= 40 ? "warm" : "calm"} territory: ${Math.round(score)} out of 100 on the composite meter, led by ${names}.`;
}

export function buildAggregateInterpretation(snapshots: MetricSnapshot[]) {
  const hot = snapshots.filter((snapshot) => snapshot.subscore >= 70).length;
  const top = snapshots
    .slice()
    .sort((left, right) => right.subscore - left.subscore)
    .slice(0, 2)
    .map((snapshot) => snapshot.metric.name)
    .join(" and ");
  return `Across the leading signals, ${hot} of ${snapshots.length} indicators are reading above their historical norm, led by ${top}. The mix is saying that risk appetite is elevated and valuations are stretched, even if this does not tell you when the market will turn.`;
}
