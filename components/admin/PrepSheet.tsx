import Link from "next/link";
import { notFound } from "next/navigation";
import PrepChecklist from "@/components/admin/PrepChecklist";
import {
  CHECKLISTS,
  getChecklist,
  loadChecklist,
} from "@/lib/prep-checklist";

/**
 * One prep sheet: a heading, its counts, and the checklist itself.
 *
 * All three sheets render through here so they cannot drift apart in look or in
 * behaviour — only the file they read differs. The switcher keeps them one
 * click from each other, because the point of splitting them is that each stays
 * small enough to work through, not that they become separate tools.
 */
export default async function PrepSheet({ slug }: { slug: string }) {
  const source = getChecklist(slug);
  if (!source) notFound();

  const checklist = await loadChecklist(source.slug);

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

        <nav
          aria-label="Prep sheets"
          className="mt-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[10px] tracking-[0.14em] uppercase"
        >
          {CHECKLISTS.map((entry, index) => {
            const active = entry.slug === source.slug;
            return (
              <span key={entry.slug} className="flex items-center gap-1.5">
                {index > 0 && (
                  <span aria-hidden className="text-border">
                    /
                  </span>
                )}
                <Link
                  href={entry.href}
                  aria-current={active ? "page" : undefined}
                  title={entry.blurb}
                  className={`transition-colors ${
                    active ? "text-ink" : "text-ink-faint hover:text-ink"
                  }`}
                >
                  {entry.label}
                </Link>
              </span>
            );
          })}
        </nav>

        <p className="mt-3 font-mono text-xs text-ink-faint">
          {checklist.itemCount} items across {checklist.modules.length}{" "}
          modules &middot; hover an item to edit or hide it &middot; add your own
          at the end of any section &middot; the file{" "}
          <span className="text-ink-muted">{source.file}</span> stays the base
          list
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
                blocks: section.blocks,
                items: section.items,
              })),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
