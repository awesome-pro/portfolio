"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteArtifact } from "@/app/admin/artifacts/actions";

export default function DeleteArtifactButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;

    startTransition(async () => {
      await deleteArtifact(id);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs font-mono px-2.5 py-1 rounded-lg border border-border text-ink-faint hover:border-destructive/40 hover:text-destructive transition-colors disabled:opacity-50"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
