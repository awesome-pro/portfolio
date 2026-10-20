import PrepSheet from "@/components/admin/PrepSheet";

export const dynamic = "force-static";

export const metadata = {
  title: "Interview prep — coding interview | Admin",
  robots: { index: false, follow: false },
};

export default function PrepCodingInterviewPage() {
  return <PrepSheet slug="coding-interview" />;
}
