"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProductOpportunity } from "@/app/admin/product-opportunities/actions";

export default function DeleteProductOpportunityButton({
  id,
  name,
  redirectTo,
}: {
  id: string;
  name: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const shortName = `${name.slice(0, 25)}${name.length > 25 ? "..." : ""}`;

  function handleDelete() {
    startTransition(async () => {
      await deleteProductOpportunity(id);

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
          Delete &quot;{shortName}&quot;?
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
