import Link from "next/link";
import { Mail } from "lucide-react";
import { signInWithMagicLink } from "./actions";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-5">
      <section className="rounded-xl border border-[#e5ddd3] bg-white p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">Account</div>
        <h1 className="mt-2 text-xl font-semibold text-[#1c1612]">Sign in for personal reminders</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#4a3d33]">
          The dashboard is public. Signing in only unlocks your watchlist, in-app threshold reminders, and notification history.
        </p>
      </section>

      <section className="rounded-xl border border-[#e5ddd3] bg-white p-4 sm:max-w-md">
        <form action={signInWithMagicLink} className="space-y-3">
          <label className="block">
            <span className="block text-[10px] uppercase tracking-wide text-[#9e9087]">Email</span>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded border border-[#d4c9bc] bg-white px-3 py-2 text-sm text-[#2d2218] focus:border-[#da7756] focus:outline-none"
              placeholder="you@example.com"
            />
          </label>
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500">
            <Mail className="h-3.5 w-3.5" />
            Send magic link
          </button>
        </form>
        {status === "sent" ? (
          <p className="mt-3 text-sm leading-7 text-emerald-600">Check your inbox for the sign-in link.</p>
        ) : null}
        {status === "missing-env" ? (
          <p className="mt-3 text-sm leading-7 text-amber-700">
            Supabase Auth is not connected yet. Add the Supabase env vars to enable accounts.
          </p>
        ) : null}
        {status === "error" ? (
          <p className="mt-3 text-sm leading-7 text-red-600">Something went wrong sending the magic link.</p>
        ) : null}
      </section>

      <p className="text-sm text-[#6e5f52]">
        Back to{" "}
        <Link href="/" className="font-semibold text-[#da7756]">
          the public dashboard
        </Link>
        .
      </p>
    </main>
  );
}
