import Link from "next/link";
import { disclaimerCopy } from "@/lib/bubble";

const cases = [
  {
    title: "British Railway Mania (1840s)",
    popped:
      "A frenzy of railway company promotions and share speculation collapsed, ruining many investors who had bought the story at the wrong price.",
    leftBehind:
      "A large part of Britain's core rail network was built far faster than sober planning would likely have managed. The shareholders did not all win, but the country kept useful tracks, stations, and connections.",
    wiki: "https://en.wikipedia.org/wiki/Railway_Mania",
  },
  {
    title: "Electricity and radio (1920s)",
    popped: "Utility, radio, and other modern-life stocks became part of the optimism that fed into the 1929 crash.",
    leftBehind:
      "The economy still kept the electrified grid, consumer-electronics know-how, and a broader habit of building around powered homes and offices.",
    wiki: "https://en.wikipedia.org/wiki/Wall_Street_Crash_of_1929",
  },
  {
    title: "Telecom and dot-com fiber (late 1990s)",
    popped: "Internet and telecom equities burned enormous capital when expectations ran ahead of real demand.",
    leftBehind:
      "The cheap broadband, streaming, and cloud era benefited from infrastructure and engineering talent built during the boom. The social gain did not erase the investor losses.",
    wiki: "https://en.wikipedia.org/wiki/Dot-com_bubble",
  },
  {
    title: "US housing and mortgage credit (mid-2000s)",
    popped: "Housing prices, loose mortgage credit, and securitization cracked into a financial crisis with deep human cost.",
    leftBehind:
      "This is the credibility check: not every bubble gifts the future something wonderful. Leverage-driven manias can leave mostly damaged balance sheets, foreclosures, and distrust.",
    wiki: "https://en.wikipedia.org/wiki/United_States_housing_bubble",
  },
  {
    title: "AI capex build-out (now)",
    popped: "The answer is still open. If AI infrastructure spending runs ahead of durable revenue, some capital will have been badly allocated.",
    leftBehind:
      "The possible inheritance could include data centers, power and grid upgrades, chips, models, and trained talent. It could also include pure loss. The tracker exists to keep the question tied to actual numbers.",
    wiki: null,
  },
];

export default function LearnPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-5">
      <section className="rounded-xl border border-[#e5ddd3] bg-white p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">Education</div>
        <h1 className="mt-2 text-xl font-semibold text-[#1c1612]">Bubbles that built the future</h1>
        <p className="mt-3 text-sm leading-7 text-[#4a3d33]">
          Bubbles are painful for investors and useful for everyone who comes after. Here is what a few famous ones left behind.
        </p>
        <div className="mt-4 rounded-lg border border-[#e5ddd3] bg-[#f0ebe1] p-4 text-sm leading-7 text-[#4a3d33]">
          <p className="font-semibold text-[#1c1612]">Honesty note</p>
          <p className="mt-2">
            Society can benefit from infrastructure and ideas while individual investors still lose money. Timing and position size matter. This page is perspective, not permission to speculate.
          </p>
        </div>
      </section>

      <section className="grid gap-3">
        {cases.map((caseStudy) => (
          <article key={caseStudy.title} className="rounded-xl border border-[#e5ddd3] bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[#1c1612]">{caseStudy.title}</h2>
              {caseStudy.wiki ? (
                <a
                  href={caseStudy.wiki}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-shrink-0 text-xs font-semibold text-[#da7756]"
                >
                  Wikipedia →
                </a>
              ) : null}
            </div>
            <div className="mt-3 grid gap-3 text-sm leading-7 text-[#4a3d33] sm:grid-cols-2">
              <div className="rounded-lg border border-[#e5ddd3] bg-[#f7f2eb] p-3">
                <p className="text-[10px] uppercase tracking-wide text-[#9e9087]">What popped</p>
                <p className="mt-1">{caseStudy.popped}</p>
              </div>
              <div className="rounded-lg border border-[#e5ddd3] bg-[#f7f2eb] p-3">
                <p className="text-[10px] uppercase tracking-wide text-[#9e9087]">What it left behind</p>
                <p className="mt-1">{caseStudy.leftBehind}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <div className="rounded-xl border border-[#e5ddd3] bg-white p-4 text-sm leading-7 text-[#4a3d33]">
        <p>{disclaimerCopy.investment}</p>
      </div>
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
