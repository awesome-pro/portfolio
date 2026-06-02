"use client";

import { useState } from "react";

const AWARDS = [
  { label: "Top 1% TypeScript Engineer Globally", sub: "Algora", href: "https://algora.io/profile/awesome-pro" },
  { label: "International Youth Math Challenge Gold Honour", sub: "IYMC", href: "https://drive.google.com/file/d/1yVa7inC4SaJKWa-m0xaY7jZUIMwka792/view?usp=sharing" },
  { label: "Amazon ML Summer School 2025", sub: "Amazon", href: null },
  { label: "Reliance Foundation Scholar", sub: "Reliance Foundation", href: "https://drive.google.com/file/d/1vFGwoIFeGAxpgHGlwcPJ3qkB48vqx_On/view" },
  { label: "HDFC Badhate Kadam Scholar", sub: "HDFC Bank", href: "https://drive.google.com/file/d/17KPdIiC27LJ4wcFIAtoVYwTV9fHQgrCi/view?usp=sharing" },
  { label: "2nd Place · Outlier AI Hackathon", sub: "Outlier AI", href: null },
];

interface Experience {
  company: string;
  role: string;
  location: string;
  period: string;
  current?: boolean;
  bullets: string[];
}

const EXPERIENCES: Experience[] = [
  {
    company: "Browzer",
    role: "Founding Software Engineer",
    location: "Remote",
    period: "Sept 2025 – Present",
    current: true,
    bullets: [
      "Built Browzer's Chrome MV3 recorder + CDP-native browser automation agent, achieving 95%+ precise AX/DOM element capture with cross-iframe support, obstruction checks, and real mouse/key/upload execution.",
      "Built a smart streaming ReAct loop across FastAPI + extension with SSE tool execution, multi-tab orchestration, safe parallelism, abort/continue, and audit logs.",
      "Cut automation LLM spend by roughly 67% using compact recording traces, context-window compression, prompt caching, and model-routing across GPT-5, Claude Sonnet & Haiku.",
      "Shipped a zero-LLM replay engine: recordings run as variable-driven tool-call templates, with a stateful AI fallback that resumes mid-run on failure.",
      "Shipped self-healing docs that auto-repair on UI drift — Haiku→Sonnet diff triage, LLM-free replay of intact steps, and a CDP agent that fixes only what changed.",
    ],
  },
  {
    company: "Cynos Nexus",
    role: "Founding Software Engineer",
    location: "Noida, India",
    period: "Jan 2025 – Jul 2025",
    bullets: [
      "Shipped core features of an AI-powered real estate platform using Next.js, Nest.js, GraphQL, Redis, and GCP.",
      "Built the AI knowledge base service using FastAPI, LangChain, and vector retrieval pipelines, powering customer-facing search workflows.",
      "Developed document-ingestion pipelines using Google Cloud Vision, XLSX processing, and BullMQ workers, enabling automated extraction of customer data from spreadsheets and scanned records.",
      "Automated containerized CI/CD infrastructure via Docker, GitHub Actions, and Nginx for reverse proxy/load balancing.",
    ],
  },
  {
    company: "Etkin.ai",
    role: "Contract Software Engineer",
    location: "Remote, Türkiye",
    period: "Sept 2024 – Dec 2024",
    bullets: [
      "Built a LangChain + pgvector knowledge base powering AI-assisted document search and retrieval workflows, improving query accuracy by 15%.",
      "Developed scalable data-ingestion pipelines using bulk CSV processing and Celery workers, reducing processing time by 40%.",
      "Engineered a production PDF generation system transforming structured AI outputs and dynamic JSON reports into enterprise-grade documents.",
      "Automated deployment of AI services using Docker, GitHub Actions, and AWS EC2, establishing reliable CI/CD workflows for production environments.",
    ],
  },
  {
    company: "HeroUI",
    role: "Open Source Contributor",
    location: "Y Combinator S24 startup",
    period: "Jun 2024 – Aug 2024",
    bullets: [
      "Received a personal offer from the CEO to join HeroUI (prev. NextUI) after making open-source contributions.",
      "Resolved 10+ bugs & delivered 7+ feature enhancements in core components including Calendar, Table and Pagination.",
    ],
  },
  {
    company: "SkilledUp",
    role: "SWE Intern",
    location: "Noida",
    period: "Jan 2024 – Apr 2024",
    bullets: [],
  },
];

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExperienceRow({ exp, index }: { exp: Experience; index: number }) {
  const [open, setOpen] = useState(false);
  const hasBullets = exp.bullets.length > 0;

  return (
    <div className={index !== 0 ? "border-t border-border" : ""}>
      <button
        onClick={() => hasBullets && setOpen((v) => !v)}
        className={`w-full text-left py-5 flex items-center justify-between gap-4 ${hasBullets ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2.5 min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-semibold text-ink">{exp.company}</span>
            <span className="text-xs text-black/40">· {exp.location}</span>
          </div>
          <span className="text-sm font-medium text-ink-muted">{exp.role}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-mono text-xs text-ink-muted">{exp.period}</span>
          {hasBullets && <Chevron open={open} />}
        </div>
      </button>

      {hasBullets && (
        <div
          className="grid transition-[grid-template-rows] duration-200 ease-out"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <ul className="flex flex-col gap-2 pb-6">
              {exp.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="text-sm leading-relaxed text-ink-muted pl-4 relative before:content-['+'] before:absolute before:left-0 before:text-ink-faint"
                >
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Experience() {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto border-t border-border">
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-2">
        Where I&apos;ve worked
      </h2>

      <div className="flex flex-col">
        {EXPERIENCES.map((exp, i) => (
          <ExperienceRow key={exp.company} exp={exp} index={i} />
        ))}
      </div>

      {/* Achievements */}
      <div className="mt-2 pt-8 border-t border-border">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-2">
          Achievements
        </h2>
        <div className="flex flex-col">
          {AWARDS.map((award, i) => (
            <div
              key={award.label}
              className={`flex items-center justify-between py-4 ${i !== 0 ? "border-t border-border" : ""}`}
            >
              <div>
                <p className="text-sm font-medium text-ink">{award.label}</p>
                <p className="text-xs text-ink-faint mt-0.5">{award.sub}</p>
              </div>
              {award.href && (
                <a
                  href={award.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs shrink-0 ml-6"
                >
                  View ↗
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
