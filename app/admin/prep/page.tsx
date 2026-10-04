import PrepSheet from "@/components/admin/PrepSheet";

/**
 * Rendered once at build time — each sheet's items are baked in from its
 * markdown file. Anything added, reworded or hidden afterwards is layered on in
 * the browser from Supabase (see lib/prep-items-store.ts), so editing a list
 * from the page needs no rebuild and no deploy.
 */
export const dynamic = "force-static";

export const metadata = {
  title: "Interview prep — checklist | Admin",
  robots: { index: false, follow: false },
};

export default function PrepPage() {
  return <PrepSheet slug="checklist" />;
}
