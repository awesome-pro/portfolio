import Link from "next/link";
import InlineMarkdown from "@/components/admin/InlineMarkdown";
import PrepChecklist, {
  type PrepModuleView,
} from "@/components/admin/PrepChecklist";
import { CHECKLIST_SOURCE, loadChecklist } from "@/lib/prep-checklist";

/**
 * Rendered once at build time. The content is a file in this repository, so the
 * read never has to happen on a serverless instance — and a new item is one
 * commit, which is the same loop the rest of the site's content already uses.
 */
export const dynamic = "force-static";

export const metadata = {
  title: "Interview prep | Admin",
  robots: { index: false, follow: false },
};

export default async function PrepPage() {
  const checklist = await loadChecklist();

  const modules: PrepModuleView[] = checklist.modules.map((module) => ({
    id: module.id,
    title: module.title,
    prose: module.prose.map((paragraph, index) => (
      <InlineMarkdown key={index} text={paragraph} block />
    )),
    sections: module.sections.map((section) => ({
      id: section.id,
      title: section.title,
      implicit: section.implicit,
      prose: section.prose.map((paragraph, index) => (
        <InlineMarkdown key={index} text={paragraph} block />
      )),
      items: section.items.map((item) => ({
        key: item.key,
        label: <InlineMarkdown text={item.text} />,
      })),
    })),
  }));

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
          <div className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted">
            {checklist.intro.map((paragraph, index) => (
              <InlineMarkdown key={index} text={paragraph} block />
            ))}
          </div>
        )}

        <p className="mt-4 font-mono text-xs text-ink-faint">
          {checklist.itemCount} items across {checklist.modules.length} modules
          &middot; edit <span className="text-ink-muted">{CHECKLIST_SOURCE}</span>{" "}
          to add or reword items
        </p>

        <div className="mt-8">
          <PrepChecklist modules={modules} />
        </div>
      </div>
    </div>
  );
}
