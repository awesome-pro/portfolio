import Link from "next/link";
import PrepChecklist from "@/components/admin/PrepChecklist";
import { CHECKLIST_SOURCE, loadChecklist } from "@/lib/prep-checklist";

/**
 * Rendered once at build time — the 487 items are baked in from the markdown.
 * Anything the user adds, rewords or hides afterwards is layered on in the
 * browser from Supabase (see lib/prep-items-store.ts), so editing the list from
 * the page needs no rebuild and no deploy.
 */
export const dynamic = "force-static";

export const metadata = {
  title: "Interview prep | Admin",
  robots: { index: false, follow: false },
};

export default async function PrepPage() {
  const checklist = await loadChecklist();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-2 flex items-center justify-between gap-4">
          <p className="font-mono text-xs tracking-widest text-ink-muted uppercase">
            Admin
          </p>
          <Link
            href="/admin"
            className="font-mono text-xs text-ink-muted transition-colors hover:text-ink"
          >
            &lt;- dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-ink">
          {checklist.title}
        </h1>

        {checklist.intro.length > 0 && (
          <div className="mt-4 max-w-2xl">
            {checklist.intro.map((paragraph, index) => (
              <p
                key={index}
                className="mb-2 text-sm leading-relaxed text-ink-muted last:mb-0"
              >
                {paragraph}
              </p>
            ))}
          </div>
        )}

        <p className="mt-4 font-mono text-xs text-ink-faint">
          {checklist.itemCount} items across {checklist.modules.length} modules
          &middot; hover an item to edit or hide it &middot; add your own at the
          end of any section &middot; the file{" "}
          <span className="text-ink-muted">{CHECKLIST_SOURCE}</span> stays the
          base list
        </p>

        <div className="mt-8">
          <PrepChecklist
            modules={checklist.modules.map((module) => ({
              id: module.id,
              title: module.title,
              prose: module.prose,
              sections: module.sections.map((section) => ({
                id: section.id,
                title: section.title,
                implicit: section.implicit,
                prose: section.prose,
                items: section.items,
              })),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
