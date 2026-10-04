import PrepSheet from "@/components/admin/PrepSheet";

export const dynamic = "force-static";

export const metadata = {
  title: "Interview prep — system design & DSA | Admin",
  robots: { index: false, follow: false },
};

export default function PrepSystemDesignPage() {
  return <PrepSheet slug="system-design" />;
}
