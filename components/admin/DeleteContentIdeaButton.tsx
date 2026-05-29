"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteContentIdea } from "@/app/admin/content-ideas/actions";

export default function DeleteContentIdeaButton({
  id,
  title,
  redirectTo,
}: {
  id: string;
  title: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const shortTitle = `${title.slice(0, 25)}${title.length > 25 ? "..." : ""}`;

  function handleDelete() {
    startTransition(async () => {
      await deleteContentIdea(id);

      if (redirectTo) {
        router.push(redirectTo);
        return;
      }

      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-muted font-mono">
          Delete &quot;{shortTitle}&quot;?
        </span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs font-mono px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors disabled:opacity-50"
        >
          {isPending ? "Deleting..." : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="text-xs font-mono px-2.5 py-1 rounded-lg border border-border text-ink-muted hover:text-ink transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-mono px-2.5 py-1 rounded-lg border border-border text-ink-faint hover:border-destructive/40 hover:text-destructive transition-colors"
    >
      Delete
    </button>
  );
}
