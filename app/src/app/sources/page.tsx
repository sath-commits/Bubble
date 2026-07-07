import Link from "next/link";
import { getDashboardData } from "@/lib/data";

const attributionNotes = [
  "FRED / ALFRED series are used for Treasury, volatility, credit, GDP, labor, and monetary indicators.",
  "Robert Shiller / Yale is used for long-run CAPE context.",
  "Stooq or Shiller-style long-history index data should be used for S&P history where FRED licensing is too short for dot-com-era charts.",
  "CoinGecko is used as the free crypto-market proxy.",
  "CBOE and FINRA are listed for the next sentiment and margin-debt additions; they are not silently treated as daily data until implemented.",
];

export default async function SourcesPage() {
  const { metrics, fromSupabase } = await getDashboardData();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-5">
      <section className="rounded-xl border border-[#e5ddd3] bg-white p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">Data sources</div>
        <h1 className="mt-2 text-xl font-semibold text-[#1c1612]">A transparent, free-tier foundation</h1>
        <p className="mt-3 text-sm leading-7 text-[#4a3d33]">
          This MVP uses public and free-tier sources and labels each metric by its real update cadence. Lagging monthly and quarterly series are not presented as daily. Data mode: {fromSupabase ? "Supabase" : "static fallback"}.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <article key={metric.id} className="rounded-xl border border-[#e5ddd3] bg-white p-4">
            <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">{metric.category}</div>
            <h2 className="mt-1 text-base font-semibold text-[#1c1612]">{metric.name}</h2>
            <p className="mt-2 text-sm leading-7 text-[#4a3d33]">
              <a href={metric.sourceUrl} className="font-semibold text-[#da7756]" target="_blank" rel="noreferrer">
                {metric.sourceName}
              </a>
              {" "}• {metric.updateFrequency}
            </p>
            <p className="mt-2 text-xs leading-6 text-[#6e5f52]">{metric.caveats}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-[#e5ddd3] bg-white p-4">
        <h2 className="text-base font-semibold text-[#1c1612]">Attribution notes</h2>
        <ul className="mt-3 space-y-2 text-sm leading-7 text-[#4a3d33]">
          {attributionNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-[#6e5f52]">
        Back to{" "}
        <Link href="/" className="font-semibold text-[#da7756]">
          the dashboard
        </Link>
        .
      </p>
    </main>
  );
}
