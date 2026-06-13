import type { Metadata } from "next";
import ResumeViewer from "@/components/resume-viewer";

const resumePdfUrl = "/forward_deployed_resume.pdf";

export const metadata: Metadata = {
  title: "Forward Deployed Engineer Resume - Abhinandan",
  description:
    "Abhinandan's forward deployed engineering resume focused on applied AI, browser automation, customer workflows, documentation generation, replay, and audit logs.",
  alternates: {
    canonical: "https://abhinandan.one/forward_deployed_resume",
  },
  openGraph: {
    title: "Forward Deployed Engineer Resume - Abhinandan",
    description:
      "Abhinandan's forward deployed engineering resume focused on applied AI, browser automation, customer workflows, documentation generation, replay, and audit logs.",
    url: "https://abhinandan.one/forward_deployed_resume",
    type: "website",
  },
};

export default function ForwardDeployedResumePage() {
  return (
    <ResumeViewer
      title="Abhinandan"
      subtitle="Forward Deployed Engineer / Applied AI Engineer"
      pdfUrl={resumePdfUrl}
      downloadName="Abhinandan-Forward-Deployed-Resume.pdf"
      iframeTitle="Abhinandan forward deployed engineer resume PDF"
    />
  );
}
