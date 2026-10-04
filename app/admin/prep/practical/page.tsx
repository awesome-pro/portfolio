import PrepSheet from "@/components/admin/PrepSheet";

export const dynamic = "force-static";

export const metadata = {
  title: "Interview prep — practical | Admin",
  robots: { index: false, follow: false },
};

export default function PrepPracticalPage() {
  return <PrepSheet slug="practical" />;
}
