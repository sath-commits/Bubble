import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-5">
      <section className="rounded-xl border border-[#e5ddd3] bg-white p-4 sm:p-5">
        <div className="text-[10px] uppercase tracking-wide text-[#9e9087]">Privacy</div>
        <h1 className="mt-2 text-xl font-semibold text-[#1c1612]">Simple privacy policy</h1>
        <p className="mt-3 text-sm leading-7 text-[#4a3d33]">
          Public dashboard views do not require an account. If you sign in, Supabase Auth stores your email so you can manage personal reminders, notification history, and watchlist pins.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <h2 className="text-base font-semibold text-[#1c1612]">What is stored</h2>
          <p className="mt-3 text-sm leading-7 text-[#4a3d33]">
            Account email, user-defined alert thresholds, in-app notifications, watchlist pins, and any metric submissions you choose to send.
          </p>
        </article>
        <article className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <h2 className="text-base font-semibold text-[#1c1612]">What is not sent</h2>
          <p className="mt-3 text-sm leading-7 text-[#4a3d33]">
            Alerts are in-app only. This project does not add Resend, SendGrid, Postmark, SMTP, or any third-party notification vendor.
          </p>
        </article>
        <article className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <h2 className="text-base font-semibold text-[#1c1612]">Delete account</h2>
          <p className="mt-3 text-sm leading-7 text-[#4a3d33]">
            Signed-in users can delete their account from the account page. Related private rows are removed by database cascade policies.
          </p>
        </article>
        <article className="rounded-xl border border-[#e5ddd3] bg-white p-4">
          <h2 className="text-base font-semibold text-[#1c1612]">Data caveat</h2>
          <p className="mt-3 text-sm leading-7 text-[#4a3d33]">
            Market data is aggregated from third-party public sources and may contain gaps, errors, or delays.
          </p>
        </article>
      </section>

      <p className="text-sm text-[#6e5f52]">
        Manage settings in{" "}
        <Link href="/account" className="font-semibold text-[#da7756]">
          your account
        </Link>
        .
      </p>
    </main>
  );
}
