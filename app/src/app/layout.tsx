import type { Metadata } from "next";
import Link from "next/link";
import { Bell, BookOpen, Database, Info, Lightbulb, Sparkles } from "lucide-react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { disclaimerCopy, formatDate } from "@/lib/bubble";
import { getDashboardData } from "@/lib/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bubble Tracker",
  description: "A public dashboard for tracking stock-market bubble indicators for US markets.",
  metadataBase: new URL("https://bubble.builtthisweekend.com"),
  openGraph: {
    title: "Bubble Tracker",
    description: "A public dashboard for tracking stock-market bubble indicators for US markets.",
    type: "website",
    images: ["/api/og"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/api/og"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { snapshots } = await getDashboardData();
  const latestDate = snapshots
    .map((snapshot) => snapshot.latestDate)
    .sort()
    .at(-1) ?? snapshots[0].latestDate;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const { count: unreadCount } = supabase && user
    ? await supabase
        .from("user_notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null)
    : { count: 0 };

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#f7f2eb] text-[#1c1612]">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-[#e5ddd3] bg-[#f7f2eb]">
            <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-3 py-2 sm:px-6 sm:py-3">
              <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#e5ddd3] bg-white text-[#da7756]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="whitespace-nowrap text-sm font-semibold text-[#1c1612] sm:text-base">Bubble Tracker</span>
                <nav className="ml-1 flex items-center gap-0.5 overflow-x-auto sm:ml-3">
                  <Link href="/" className="flex flex-shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[#4a3d33] hover:bg-[#ede8df] sm:px-3 sm:gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#da7756]" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  <Link href="/about" className="flex flex-shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[#9e9087] hover:bg-[#ede8df] sm:px-3 sm:gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">About</span>
                  </Link>
                  <Link href="/sources" className="flex flex-shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[#9e9087] hover:bg-[#ede8df] sm:px-3 sm:gap-1.5">
                    <Database className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Sources</span>
                  </Link>
                  <Link href="/learn" className="flex flex-shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[#9e9087] hover:bg-[#ede8df] sm:px-3 sm:gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Learn</span>
                  </Link>
                  <Link href="/ideas" className="flex flex-shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[#9e9087] hover:bg-[#ede8df] sm:px-3 sm:gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Ideas</span>
                  </Link>
                  <Link href="/account" className="flex flex-shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-[#9e9087] hover:bg-[#ede8df] sm:px-3 sm:gap-1.5">
                    <Bell className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Account</span>
                  </Link>
                </nav>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2 text-xs text-[#6e5f52]">
                <span className="rounded border border-[#d4c9bc] bg-white px-2 py-1">🇺🇸 US markets</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-[#e5ddd3]/60 px-3 py-2 text-xs text-[#9e9087] sm:px-6">
              <span>Latest data: {formatDate(latestDate)}</span>
              <span className="text-[#d4c9bc]">·</span>
              <span>Educational only</span>
              {unreadCount ? (
                <>
                  <span className="text-[#d4c9bc]">·</span>
                  <Link href="/account" className="font-semibold text-[#da7756]">
                    {unreadCount} unread reminder{unreadCount === 1 ? "" : "s"}
                  </Link>
                </>
              ) : null}
            </div>
          </header>
          <div className="flex-1">{children}</div>
          <footer className="border-t border-[#e5ddd3] bg-[#f7f2eb]">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-3 py-5 text-sm leading-7 text-[#4a3d33] sm:px-6 sm:py-6">
              <div className="rounded-xl border border-[#e5ddd3] bg-white p-4">
                <p className="text-[10px] uppercase tracking-wide text-[#9e9087]">Educational only, not investment advice</p>
                <p className="mt-2 text-sm text-[#4a3d33]">{disclaimerCopy.investment}</p>
              </div>
              <div className="rounded-xl border border-[#e5ddd3] bg-[#f0ebe1] p-4">
                <p className="text-[10px] uppercase tracking-wide text-[#9e9087]">Personal project</p>
                <p className="mt-2 text-sm text-[#4a3d33]">{disclaimerCopy.personal}</p>
              </div>
              <Link href="/privacy" className="text-xs font-semibold text-[#da7756]">
                Privacy and account deletion
              </Link>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
