import type { Metadata } from "next";
import { Download, ExternalLink } from "lucide-react";
import Footer from "@/components/footer";
import Nav from "@/components/nav";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-background">
      <Nav />
      <main className="mx-auto flex w-full max-w-6xl flex-col px-4 py-10 sm:px-6 sm:py-14">
        <section className="mb-6 flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">
              Resume
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Abhinandan
            </h1>
            <p className="mt-2 text-sm text-ink-muted sm:text-base">
              Agentic AI Engineer & ML Engineer
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild className="h-10 rounded-full px-4">
              <a href={resumePdfUrl} download="Abhinandan-Resume.pdf">
                <Download aria-hidden className="size-4" />
                Download PDF
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-full px-4"
            >
              <a
                href={resumePdfUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink aria-hidden className="size-4" />
                Open PDF
              </a>
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-border bg-[#f6f6f3] p-2 shadow-sm">
          <iframe
            title="Abhinandan resume PDF"
            src={`${resumePdfUrl}#view=FitH`}
            className="h-[calc(100vh-14rem)] min-h-[620px] w-full rounded-md bg-white"
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}
