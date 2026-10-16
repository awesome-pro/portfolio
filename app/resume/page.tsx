import type { Metadata } from "next";
import ResumeViewer from "@/components/resume-viewer";
import {
  RESUME_DESCRIPTION,
  RESUME_PDF,
  RESUME_SUBTITLE,
  RESUME_TEXT,
  RESUME_TITLE,
} from "@/lib/resume";

export const metadata: Metadata = {
  title: `Resume - ${RESUME_TITLE}`,
  description: RESUME_DESCRIPTION,
  alternates: {
    canonical: "https://abhinandan.one/resume",
  },
  openGraph: {
    title: `Resume - ${RESUME_TITLE}`,
    description: RESUME_DESCRIPTION,
    url: "https://abhinandan.one/resume",
    type: "website",
  },
};

export default function ResumePage() {
  return (
    <ResumeViewer
      title={RESUME_TITLE}
      subtitle={RESUME_SUBTITLE}
      pdfUrl={RESUME_PDF}
      textUrl={RESUME_TEXT}
      downloadName="Abhinandan-Resume.pdf"
      iframeTitle="Abhinandan resume PDF"
    />
  );
}
