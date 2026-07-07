import Link from "next/link";
import { Bell, Pin, Plus, ShieldCheck } from "lucide-react";
import { disclaimerCopy, formatDate } from "@/lib/bubble";
import { getDashboardData } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/app/sign-in/actions";
import { createAlert, deleteAccount, markNotificationsRead, toggleWatchlist } from "./actions";

type AlertRow = {
  id: string;
  target_type: string;
  metric_id: string | null;
  operator: string;
  threshold: number | string;
  active: boolean;
  created_at: string;
};

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  triggered_on: string;
  read_at: string | null;
};

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { metrics } = await getDashboardData();

  if (!supabase) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-5">
        <section className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <h1 className="text-xl font-semibold text-[#1c1612]">Accounts need Supabase env vars</h1>
          <p className="mt-3 text-sm leading-7 text-[#4a3d33]">
            Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to enable auth, alerts, notifications, and watchlists.
          </p>
        </section>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-5">
        <section className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">Account</div>
          <h1 className="mt-2 text-xl font-semibold text-[#1c1612]">Sign in to set personal reminders</h1>
          <p className="mt-3 text-sm leading-7 text-[#4a3d33]">Viewing the dashboard does not require an account.</p>
          <Link href="/sign-in" className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500">
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  const [{ data: alerts }, { data: notifications }, { data: watchlist }] = await Promise.all([
    supabase.from("user_alerts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("user_notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
    supabase.from("user_watchlist").select("metric_id").eq("user_id", user.id),
  ]);

  const alertRows = (alerts ?? []) as AlertRow[];
  const notificationRows = (notifications ?? []) as NotificationRow[];
  const watchlistIds = new Set(((watchlist ?? []) as { metric_id: string }[]).map((row) => row.metric_id));
  const unread = notificationRows.filter((notification) => !notification.read_at);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-5">
      {unread.length ? (
        <section className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold">You have {unread.length} unread reminder{unread.length === 1 ? "" : "s"}.</p>
              <p className="mt-1">These are user-defined reminders only, not investment advice or trading signals.</p>
            </div>
            <form action={markNotificationsRead}>
              <button className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-900">Mark read</button>
            </form>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-[#e5ddd3] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">Account</div>
            <h1 className="mt-2 text-xl font-semibold text-[#1c1612]">Your bubble tracker</h1>
            <p className="mt-2 text-sm text-[#4a3d33]">{user.email}</p>
          </div>
          <form action={signOut}>
            <button className="rounded-lg border border-[#d4c9bc] bg-white px-4 py-2 text-xs font-medium text-[#4a3d33] hover:bg-[#ede8df]">Sign out</button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-[#9e9087]">
            <Plus className="h-3.5 w-3.5 text-[#da7756]" />
            New reminder
          </div>
          <form action={createAlert} className="mt-4 space-y-3">
            <label className="block">
              <span className="block text-[10px] uppercase tracking-wide text-[#9e9087]">Alert type</span>
              <select name="target_type" className="mt-1 w-full rounded border border-[#d4c9bc] bg-white px-3 py-2 text-sm text-[#2d2218]">
                <option value="composite">Composite score</option>
                <option value="metric">Metric value</option>
                <option value="distance_to_peak">Distance to prior froth peak</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-[10px] uppercase tracking-wide text-[#9e9087]">Metric</span>
              <select name="metric_id" className="mt-1 w-full rounded border border-[#d4c9bc] bg-white px-3 py-2 text-sm text-[#2d2218]">
                <option value="composite">Composite only</option>
                {metrics.map((metric) => (
                  <option key={metric.id} value={metric.id}>
                    {metric.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-[0.7fr_1fr] gap-3">
              <label className="block">
                <span className="block text-[10px] uppercase tracking-wide text-[#9e9087]">Operator</span>
                <select name="operator" className="mt-1 w-full rounded border border-[#d4c9bc] bg-white px-3 py-2 text-sm text-[#2d2218]">
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                  <option value="crosses">crosses</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-[10px] uppercase tracking-wide text-[#9e9087]">Threshold</span>
                <input name="threshold" type="number" step="0.01" required className="mt-1 w-full rounded border border-[#d4c9bc] bg-white px-3 py-2 text-sm text-[#2d2218]" />
              </label>
            </div>
            <p className="text-xs leading-6 text-[#6e5f52]">This creates an in-app reminder only. No email is sent.</p>
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500">
              <ShieldCheck className="h-3.5 w-3.5" />
              Save reminder
            </button>
          </form>
        </article>

        <article className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-[#9e9087]">
            <Bell className="h-3.5 w-3.5 text-[#da7756]" />
            Notifications
          </div>
          <div className="mt-4 space-y-3">
            {notificationRows.length ? notificationRows.map((notification) => (
              <div key={notification.id} className="rounded-lg border border-[#e5ddd3] bg-[#f7f2eb] p-3 text-sm leading-7 text-[#4a3d33]">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-[#1c1612]">{notification.title}</p>
                  <span className="text-[10px] uppercase tracking-wide text-[#9e9087]">{notification.read_at ? "Read" : "New"}</span>
                </div>
                <p className="mt-1">{notification.body}</p>
                <p className="mt-1 text-[10px] text-[#b8ad9e]">{formatDate(notification.triggered_on)}</p>
              </div>
            )) : <p className="text-sm text-[#6e5f52]">No reminders have triggered yet.</p>}
          </div>
        </article>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <h2 className="text-base font-semibold text-[#1c1612]">Saved reminders</h2>
          <div className="mt-4 space-y-2 text-sm leading-7 text-[#4a3d33]">
            {alertRows.length ? alertRows.map((alert) => (
              <div key={alert.id} className="rounded-lg border border-[#e5ddd3] bg-[#f7f2eb] p-3">
                {alert.target_type} {alert.operator} {String(alert.threshold)} {alert.metric_id ? `on ${alert.metric_id}` : ""}
              </div>
            )) : <p className="text-[#6e5f52]">No reminders yet.</p>}
          </div>
        </article>

        <article className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-[#9e9087]">
            <Pin className="h-3.5 w-3.5 text-[#da7756]" />
            Watchlist
          </div>
          <div className="mt-4 grid gap-2">
            {metrics.map((metric) => {
              const pinned = watchlistIds.has(metric.id);
              return (
                <form key={metric.id} action={toggleWatchlist} className="flex items-center justify-between gap-3 rounded-lg border border-[#e5ddd3] bg-[#f7f2eb] px-3 py-2 text-sm text-[#4a3d33]">
                  <input type="hidden" name="metric_id" value={metric.id} />
                  <input type="hidden" name="watch_action" value={pinned ? "remove" : "add"} />
                  <span>{metric.name}</span>
                  <button className="rounded border border-[#d4c9bc] bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-[#4a3d33]">
                    {pinned ? "Pinned" : "Pin"}
                  </button>
                </form>
              );
            })}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-[#e5ddd3] bg-white p-4 text-xs leading-6 text-[#6e5f52]">
        {disclaimerCopy.investment}
      </section>

      <section className="rounded-xl border border-[#e5ddd3] bg-white p-4">
        <h2 className="text-base font-semibold text-[#1c1612]">Privacy controls</h2>
        <p className="mt-2 text-sm leading-7 text-[#4a3d33]">
          Delete your account to remove your auth profile and cascade-delete alerts, notifications, watchlist pins, and owned submission links.
        </p>
        <form action={deleteAccount} className="mt-3">
          <button className="rounded-lg border border-red-400 bg-white px-4 py-2 text-xs font-medium text-red-600 hover:bg-[#ede8df]">
            Delete account
          </button>
        </form>
      </section>
    </main>
  );
}
