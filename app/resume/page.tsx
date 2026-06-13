import type { Metadata } from "next";
import ResumeViewer from "@/components/resume-viewer";

const resumePdfUrl = "/resume.pdf";

export const metadata: Metadata = {
  title: "Resume - Abhinandan",
  description:
    "Abhinandan's resume for agentic AI, machine learning engineering, and production AI infrastructure roles.",
  alternates: {
    canonical: "https://abhinandan.one/resume",
  },
  openGraph: {
    title: "Resume - Abhinandan",
    description:
      "Abhinandan's resume for agentic AI, machine learning engineering, and production AI infrastructure roles.",
    url: "https://abhinandan.one/resume",
    type: "website",
  },
};

export default function ResumePage() {
  return (
    <ResumeViewer
      title="Abhinandan"
      subtitle="Agentic AI Engineer & ML Engineer"
      pdfUrl={resumePdfUrl}
      downloadName="Abhinandan-Resume.pdf"
      iframeTitle="Abhinandan resume PDF"
    />
  );
}
