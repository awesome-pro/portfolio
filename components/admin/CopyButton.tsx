"use client";

import { useState } from "react";

export default function CopyButton({
  text,
  label = "Copy",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className={
        className ??
        "text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors " +
          (copied
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-surface text-ink-muted border-border hover:text-ink hover:border-ink-muted")
      }
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
