import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/data";
import { createManualMetric, updateSubmissionStatus, upsertManualMetricValue } from "./actions";

type Submission = {
  id: string;
  proposed_name: string;
  description: string;
  status: string;
  votes: number;
};

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const { metrics } = await getDashboardData();

  if (!supabase) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-5">
        <section className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <h1 className="text-xl font-semibold text-[#1c1612]">Admin needs Supabase</h1>
          <p className="mt-3 text-sm text-[#4a3d33]">Connect Supabase env vars and set `ADMIN_EMAILS` to use manual metric tools.</p>
        </section>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  const isAdmin = user?.email ? admins.includes(user.email.toLowerCase()) : false;
  const { data } = isAdmin
    ? await supabase.from("metric_submissions").select("*").order("votes", { ascending: false })
    : { data: [] };
  const submissions = (data ?? []) as Submission[];

  if (!isAdmin) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-5">
        <section className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <h1 className="text-xl font-semibold text-[#1c1612]">Admin access required</h1>
          <p className="mt-3 text-sm text-[#4a3d33]">Sign in with an email listed in `ADMIN_EMAILS`.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-5">
      <section className="rounded-xl border border-[#e5ddd3] bg-white p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">Admin</div>
        <h1 className="mt-2 text-xl font-semibold text-[#1c1612]">Manual metrics and submissions</h1>
        <p className="mt-3 text-sm leading-7 text-[#4a3d33]">
          Use this for Tier 3 curated signals that cannot be fetched reliably from free APIs.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <h2 className="text-base font-semibold text-[#1c1612]">Create manual metric</h2>
          <form action={createManualMetric} className="mt-4 space-y-3">
            {[
              ["id", "ID"],
              ["slug", "Slug"],
              ["name", "Name"],
              ["category", "Category"],
              ["unit", "Unit"],
              ["description_short", "Short description"],
              ["description_long", "Long description"],
              ["why_it_matters", "Why it matters"],
              ["source_name", "Source name"],
              ["source_url", "Source URL"],
              ["update_frequency", "Update frequency"],
              ["caveats", "Caveats"],
            ].map(([name, label]) => (
              <label key={name} className="block">
                <span className="block text-[10px] uppercase tracking-wide text-[#9e9087]">{label}</span>
                <input name={name} className="mt-1 w-full rounded border border-[#d4c9bc] bg-white px-3 py-2 text-sm" />
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm text-[#4a3d33]">
              <input type="checkbox" name="included_in_composite" />
              Include in composite
            </label>
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500">Save metric</button>
          </form>
        </article>

        <article className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <h2 className="text-base font-semibold text-[#1c1612]">Add manual value</h2>
          <form action={upsertManualMetricValue} className="mt-4 space-y-3">
            <label className="block">
              <span className="block text-[10px] uppercase tracking-wide text-[#9e9087]">Metric</span>
              <select name="metric_id" className="mt-1 w-full rounded border border-[#d4c9bc] bg-white px-3 py-2 text-sm">
                {metrics.map((metric) => (
                  <option key={metric.id} value={metric.id}>
                    {metric.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-wide text-[#9e9087]">Date</span>
              <input name="date" type="date" required className="mt-1 w-full rounded border border-[#d4c9bc] bg-white px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-wide text-[#9e9087]">Value</span>
              <input name="value" type="number" step="0.0001" required className="mt-1 w-full rounded border border-[#d4c9bc] bg-white px-3 py-2 text-sm" />
            </label>
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500">Save value</button>
          </form>
        </article>
      </section>

      <section className="rounded-xl border border-[#e5ddd3] bg-white p-4">
        <h2 className="text-base font-semibold text-[#1c1612]">Review submissions</h2>
        <div className="mt-4 space-y-3">
          {submissions.length ? submissions.map((submission) => (
            <div key={submission.id} className="rounded-lg border border-[#e5ddd3] bg-[#f7f2eb] p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#1c1612]">{submission.proposed_name}</h3>
                  <p className="mt-1 text-sm leading-7 text-[#4a3d33]">{submission.description}</p>
                  <p className="text-[10px] uppercase tracking-wide text-[#9e9087]">{submission.votes} votes • {submission.status}</p>
                </div>
                <form action={updateSubmissionStatus} className="flex gap-2">
                  <input type="hidden" name="submission_id" value={submission.id} />
                  <button name="status" value="approved" className="rounded border border-emerald-400 bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">Approve</button>
                  <button name="status" value="rejected" className="rounded border border-red-400 bg-white px-2 py-1 text-[10px] font-medium text-red-600">Reject</button>
                </form>
              </div>
            </div>
          )) : <p className="text-sm text-[#6e5f52]">No submissions yet.</p>}
        </div>
      </section>
    </main>
  );
}
