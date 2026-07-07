import Link from "next/link";
import { Lightbulb, ThumbsUp } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { submitMetricIdea, upvoteIdea } from "./actions";

type Submission = {
  id: string;
  proposed_name: string;
  description: string;
  proposed_source_url: string;
  rationale: string;
  status: string;
  votes: number;
  created_at: string;
};

export default async function IdeasPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = supabase
    ? await supabase.from("metric_submissions").select("*").order("votes", { ascending: false }).order("created_at", { ascending: false })
    : { data: [] };
  const submissions = (data ?? []) as Submission[];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-5">
      <section className="rounded-xl border border-[#e5ddd3] bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-[#9e9087]">
          <Lightbulb className="h-3.5 w-3.5 text-[#da7756]" />
          Ideas
        </div>
        <h1 className="mt-2 text-xl font-semibold text-[#1c1612]">Suggest a missing bubble signal</h1>
        <p className="mt-3 text-sm leading-7 text-[#4a3d33]">
          Public submissions help collect the signals this tracker might be missing. Approved ideas can seed future metrics, especially manual or curated Tier 3 entries.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <h2 className="text-base font-semibold text-[#1c1612]">Submit an idea</h2>
          <form action={submitMetricIdea} className="mt-4 space-y-3">
            <label className="block">
              <span className="block text-[10px] uppercase tracking-wide text-[#9e9087]">Metric name</span>
              <input name="proposed_name" required className="mt-1 w-full rounded border border-[#d4c9bc] bg-white px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-wide text-[#9e9087]">Description</span>
              <textarea name="description" required rows={3} className="mt-1 w-full rounded border border-[#d4c9bc] bg-white px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-wide text-[#9e9087]">Source URL</span>
              <input name="proposed_source_url" type="url" required className="mt-1 w-full rounded border border-[#d4c9bc] bg-white px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-wide text-[#9e9087]">Why it matters</span>
              <textarea name="rationale" required rows={3} className="mt-1 w-full rounded border border-[#d4c9bc] bg-white px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-wide text-[#9e9087]">Email, optional</span>
              <input name="email" type="email" className="mt-1 w-full rounded border border-[#d4c9bc] bg-white px-3 py-2 text-sm" />
            </label>
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500">Submit idea</button>
          </form>
          {status ? <p className="mt-3 text-sm text-[#6e5f52]">Status: {status}</p> : null}
          {!supabase ? <p className="mt-3 text-sm text-amber-700">Connect Supabase env vars to store submissions.</p> : null}
        </article>

        <article className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <h2 className="text-base font-semibold text-[#1c1612]">Submitted metrics</h2>
          <div className="mt-4 space-y-3">
            {submissions.length ? submissions.map((submission) => (
              <div key={submission.id} className="rounded-lg border border-[#e5ddd3] bg-[#f7f2eb] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1c1612]">{submission.proposed_name}</h3>
                    <p className="mt-1 text-sm leading-7 text-[#4a3d33]">{submission.description}</p>
                  </div>
                  <span className="rounded border border-[#d4c9bc] bg-white px-2 py-1 text-[10px] uppercase tracking-wide text-[#6e5f52]">{submission.status}</span>
                </div>
                <p className="mt-2 text-xs leading-6 text-[#6e5f52]">{submission.rationale}</p>
                <a href={submission.proposed_source_url} className="mt-2 block text-xs font-semibold text-[#da7756]" target="_blank" rel="noreferrer">
                  Source
                </a>
                <form action={upvoteIdea} className="mt-3">
                  <input type="hidden" name="submission_id" value={submission.id} />
                  <button className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4c9bc] bg-white px-3 py-1.5 text-xs text-[#4a3d33] hover:bg-[#ede8df]">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {submission.votes} votes
                  </button>
                </form>
              </div>
            )) : <p className="text-sm text-[#6e5f52]">No submissions yet.</p>}
          </div>
        </article>
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
