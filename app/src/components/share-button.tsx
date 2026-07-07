"use client";

import { Copy, Share2 } from "lucide-react";
import { useState } from "react";

const canonicalUrl = "https://bubble.builtthisweekend.com";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Market Bubble Tracker", text: "How frothy is the market right now?", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const encodedUrl = encodeURIComponent(canonicalUrl);
  const encodedText = encodeURIComponent("Market Bubble Tracker: how frothy are US markets right now?");

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4c9bc] bg-white px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-[#4a3d33]"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-[#d4c9bc] bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#4a3d33]"
      >
        X
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-[#d4c9bc] bg-white px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#4a3d33]"
      >
        in
      </a>
      <button
        type="button"
        onClick={async () => {
          const url = window.location.href;
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
        className="inline-flex items-center gap-1 rounded-lg border border-[#d4c9bc] bg-white px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wide text-[#4a3d33]"
      >
        <Copy className="h-3.5 w-3.5" />
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
