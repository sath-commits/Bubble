import Link from "next/link";
import { disclaimerCopy } from "@/lib/bubble";

export default function AboutPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-5">
      <section className="rounded-xl border border-[#e5ddd3] bg-white p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">About</div>
        <h1 className="mt-2 text-xl font-semibold text-[#1c1612]">A calm, US-only view of market froth</h1>
        <p className="mt-3 text-sm leading-7 text-[#4a3d33]">
          This project focuses on US equity-market conditions only. The metrics here are designed to describe valuation and sentiment extremes rather than to time market turns.
        </p>
        <div className="mt-4 rounded-lg border border-[#e5ddd3] bg-[#f0ebe1] p-4 text-sm leading-7 text-[#4a3d33]">
          <p className="font-semibold text-[#1c1612]">Personal project disclaimer</p>
          <p className="mt-2">{disclaimerCopy.personal}</p>
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <h2 className="text-base font-semibold text-[#1c1612]">How the composite works</h2>
          <p className="mt-3 text-sm leading-7 text-[#4a3d33]">
            Every metric is converted into a percentile score against its own historical range, then mapped to a 0–100 subscore. The composite is a simple average across category scores so the methodology is transparent and easy to tune.
          </p>
        </article>
        <article className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <h2 className="text-base font-semibold text-[#1c1612]">What it is not</h2>
          <p className="mt-3 text-sm leading-7 text-[#4a3d33]">
            The score is a heuristic snapshot of sentiment and valuation extremes. It does not predict the next crash, and it is not a trading instruction.
          </p>
        </article>
      </section>
      <p className="text-sm text-[#6e5f52]">
        Want to explore the underlying signals? Head to <Link href="/" className="font-semibold text-[#da7756]">the home page</Link> or <Link href="/sources" className="font-semibold text-[#da7756]">the data sources page</Link>.
      </p>
    </main>
  );
}
