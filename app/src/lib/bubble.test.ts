import { describe, expect, it } from "vitest";
import { buildCompositeSnapshot, buildMetricSnapshots, getMetrics, resolveMetricCatalog, resolveZone } from "./bubble";

describe("bubble scoring", () => {
  it("produces a stable composite score and a named zone", () => {
    const snapshots = buildMetricSnapshots();
    const composite = buildCompositeSnapshot(snapshots);

    expect(typeof composite.score).toBe("number");
    expect(composite.score).toBeGreaterThanOrEqual(0);
    expect(composite.score).toBeLessThanOrEqual(100);
    expect(resolveZone(composite.score).label).toBeTruthy();
  });

  it("keeps the highest-scoring metric in the top drivers", () => {
    const snapshots = buildMetricSnapshots();
    const composite = buildCompositeSnapshot(snapshots);
    const topDriver = composite.topDrivers[0];

    expect(topDriver).toBeDefined();
    expect(topDriver?.subscore).toBeGreaterThanOrEqual(0);
  });

  it("falls back to the seeded catalog when live metrics are sparse", () => {
    const fallbackMetrics = getMetrics();
    const sparseLiveMetrics = fallbackMetrics.slice(0, 2);
    const resolved = resolveMetricCatalog(sparseLiveMetrics, fallbackMetrics);

    expect(resolved.metrics).toEqual(fallbackMetrics);
    expect(resolved.fromSupabase).toBe(false);
  });
});
