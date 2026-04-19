"use client";

import { useEffect, useState } from "react";
import { Heart, Eye, Link2, Check } from "lucide-react";

interface Props {
  slug: string;
}

export default function BlogInteractions({ slug }: Props) {
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const likedKey = `blog_liked_${slug}`;
    const viewedKey = `blog_viewed_${slug}`;
    const alreadyLiked = localStorage.getItem(likedKey) === "1";
    const alreadyViewed = sessionStorage.getItem(viewedKey) === "1";

    setLiked(alreadyLiked);

    const fetchStats = () =>
      fetch(`/api/blog-stats/${slug}`).then((r) => r.json());

    if (!alreadyViewed) {
      sessionStorage.setItem(viewedKey, "1");
      fetch(`/api/blog-stats/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "view" }),
      })
        .then((r) => r.json())
        .then((d) => {
          setLikes(d.likes ?? 0);
          setViews(d.views ?? 0);
        })
        .catch(() => fetchStats().then((d) => { setLikes(d.likes ?? 0); setViews(d.views ?? 0); }).catch(() => {}));
    } else {
      fetchStats().then((d) => { setLikes(d.likes ?? 0); setViews(d.views ?? 0); }).catch(() => {});
    }
  }, [slug]);

  async function toggleLike() {
    const likedKey = `blog_liked_${slug}`;
    const action = liked ? "unlike" : "like";
    const nextLiked = !liked;

    setLiked(nextLiked);
    setLikes((n) => (action === "like" ? n + 1 : Math.max(0, n - 1)));
    if (nextLiked) localStorage.setItem(likedKey, "1");
    else localStorage.removeItem(likedKey);

    try {
      const res = await fetch(`/api/blog-stats/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await res.json();
      setLikes(d.likes ?? 0);
    } catch {}
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="flex items-center gap-4 font-mono text-xs text-ink-faint">
      {/* Views */}
      <span className="flex items-center gap-1.5">
        <Eye className="w-3.5 h-3.5" />
        {views}
      </span>

      {/* Like button */}
      <button
        onClick={toggleLike}
        aria-label={liked ? "Unlike this post" : "Like this post"}
        className={`flex items-center gap-1.5 transition-colors ${
          liked ? "text-red-500" : "hover:text-ink"
        }`}
      >
        <Heart
          className="w-3.5 h-3.5"
          fill={liked ? "currentColor" : "none"}
          strokeWidth={liked ? 0 : 1.75}
        />
        {likes}
      </button>

      {/* Copy link */}
      <button
        onClick={copyLink}
        aria-label="Copy link"
        className="flex items-center gap-1.5 hover:text-ink transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-green-500" />
            <span className="text-green-500">Copied</span>
          </>
        ) : (
          <>
            <Link2 className="w-3.5 h-3.5" />
            Copy link
          </>
        )}
      </button>
    </div>
  );
}
