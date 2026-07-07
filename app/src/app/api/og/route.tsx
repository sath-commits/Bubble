import { ImageResponse } from "next/og";
import { getDashboardData } from "@/lib/data";

export const runtime = "edge";

export async function GET() {
  const { composite } = await getDashboardData();
  const drivers = composite.topDrivers.map((driver) => driver.metric.name).join(" • ");

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 48,
          background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)",
          color: "#1f2937",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 700 }}>Bubble Tracker</div>
          <div style={{ fontSize: 20, color: "#b45309" }}>US markets</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 52, fontWeight: 700 }}>{composite.score}/100</div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>{composite.zone}</div>
          <div style={{ fontSize: 24, lineHeight: 1.3 }}>{composite.summary}</div>
          <div style={{ fontSize: 20, color: "#92400e" }}>Top drivers: {drivers}</div>
        </div>
        <div style={{ fontSize: 20, color: "#92400e" }}>bubble.builtthisweekend.com</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
