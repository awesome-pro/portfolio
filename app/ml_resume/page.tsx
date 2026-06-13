import type { Metadata } from "next";
import ResumeViewer from "@/components/resume-viewer";

const resumePdfUrl = "/ml_resume.pdf";

export const metadata: Metadata = {
  title: "AI/ML Engineer Resume - Abhinandan",
  description:
    "Abhinandan's AI/ML engineer resume focused on machine learning, PyTorch, TRL, process reward models, evaluations, and retrieval systems.",
  alternates: {
    canonical: "https://abhinandan.one/ml_resume",
  },
  openGraph: {
    title: "AI/ML Engineer Resume - Abhinandan",
    description:
      "Abhinandan's AI/ML engineer resume focused on machine learning, PyTorch, TRL, process reward models, evaluations, and retrieval systems.",
    url: "https://abhinandan.one/ml_resume",
    type: "website",
  },
};

export default function MlResumePage() {
  return (
    <ResumeViewer
      title="Abhinandan"
      subtitle="AI/ML Engineer"
      pdfUrl={resumePdfUrl}
      downloadName="Abhinandan-AI-ML-Resume.pdf"
      iframeTitle="Abhinandan AI/ML engineer resume PDF"
    />
  );
}
