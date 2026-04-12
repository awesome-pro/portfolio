"use client";

import { useEffect, useState } from "react";

interface VisitorStats {
  today: number;
  total: number;
}

export default function VisitorCounter() {
  const [stats, setStats] = useState<VisitorStats | null>(null);

  useEffect(() => {
    const SESSION_KEY = "visitor_tracked";

    async function track() {
      try {
        const alreadyTracked = sessionStorage.getItem(SESSION_KEY);
        const method = alreadyTracked ? "GET" : "POST";

        const res = await fetch("/api/visitors", { method });
        if (!res.ok) return;

        const data: VisitorStats = await res.json();
        setStats(data);

        if (!alreadyTracked) {
          sessionStorage.setItem(SESSION_KEY, "1");
        }
      } catch {
        // silently fail — don't break the page
      }
    }

    track();
  }, []);

  if (!stats) return null;

  return (
    <span className="text-xs text-ink-muted tabular-nums">
      <span title="Visitors today">◉ {stats.today.toLocaleString()} today</span>
      <span className="mx-1.5">·</span>
      <span title="Total visitors">{stats.total.toLocaleString()} total</span>
    </span>
  );
}
