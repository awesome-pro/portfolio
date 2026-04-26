const AWARDS = [
  { label: "Top 1% TypeScript Engineer Globally · Algora", href: "https://algora.io/profile/awesome-pro" },
  { label: "HDFC Badhate Kadam Scholar", href: "https://drive.google.com/file/d/17KPdIiC27LJ4wcFIAtoVYwTV9fHQgrCi/view?usp=sharing" },
  { label: "Reliance Foundation Scholar", href: "https://drive.google.com/file/d/1vFGwoIFeGAxpgHGlwcPJ3qkB48vqx_On/view" },
  { label: "Amazon ML Summer School 2025", href: null },
  { label: "2nd Place · Outlier AI Hackathon", href: null },
  { label: "IYMC Gold Honour", href: "https://drive.google.com/file/d/1yVa7inC4SaJKWa-m0xaY7jZUIMwka792/view?usp=sharing" },
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
    period: "Sep 2025 – Present",
    current: true,
    bullets: [
      "Built a CDP-based browser automation engine using Electron.js and Chrome DevTools Protocol, enabling reliable semantic action capture and replay across complex web workflows.",
      "Designed and shipped a WXT Chrome extension (MV3) with a FastAPI backend, orchestrating real-time browser ↔ server communication via SSE with Heroku-tuned heartbeat infrastructure.",
      "Integrated Claude as the LLM backbone to plan and execute automation tasks from recorded browser actions, powering an agentic execution pipeline end-to-end.",
      "Architected multi-tenant auth using Supabase with JWT custom claims, role-based access control, and 30-day session persistence across web and extension clients.",
      "Implemented Stripe subscription billing with webhook handling for edge cases including cancellation flows and payment recovery.",
      "Set up GitHub Actions CI/CD with automated Claude-powered code review and changelog generation, reducing manual release overhead significantly.",
      "Built a process graph system using Neo4j + Supabase to model and persist workflow relationships extracted from recorded browser sessions.",
    ],
  },
  {
    company: "Cynos Nexus",
    role: "Software Engineer (Part-time)",
    location: "Noida, India",
    period: "Jan 2025 – Jul 2025",
    bullets: [
      "Developed features that helped acquire 20 clients in 2 months, contributing to ₹100K in new MRR.",
      "Built the AI knowledge base service using FastAPI & LangChain.",
      "Automated deployment infrastructure using Docker, GitHub Actions for CI/CD, and Nginx for reverse proxy/load balancing.",
      "Engineered secure AWS S3 multi-part file uploads handling files up to 5GB, ensuring data integrity.",
      "Integrated Razorpay for automated payment processing, achieving a >95% transaction success rate.",
    ],
  },
  {
    company: "Caresept",
    role: "Contract Software Engineer",
    location: "Remote, Türkiye",
    period: "Sept 2024 – Dec 2024",
    bullets: [
      "Engineered a high-performance PDF generator using WeasyPrint, converting dynamic JSON reports to high-quality PDFs.",
      "Optimised bulk CSV data processing using Celery worker, reducing processing time by 40%.",
      "Built a LangChain and pgvector knowledge base, improving ML model query accuracy by 15%.",
      "Established a CI/CD pipeline with GitHub Actions and Docker on AWS EC2.",
    ],
  },
  {
    company: "NextUI",
    role: "Open-source Contributor",
    location: "Y Combinator S24",
    period: "Jun 2024 – Aug 2024",
    bullets: [
      "Received a personal offer from the CEO after making impactful open-source contributions.",
      "Resolved 10+ bugs in core components including Calendar, Table, and Pagination.",
      "Delivered 7+ feature enhancements improving component flexibility and extensibility.",
    ],
  },
  {
    company: "SkilledUp",
    role: "SWE Intern",
    location: "Noida, India",
    period: "Feb 2024 – May 2024",
    bullets: [
      "Built the backend for an enterprise Learning Management System serving 400+ users.",
      "Implemented JWT and OAuth 2.0 authentication securing 400+ user accounts with near-zero breaches.",
      "Developed a MySQL + Express.js service handling ~4,000 daily queries.",
    ],
  },
];

export default function Experience() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-border">
      <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-3">
        Experience
      </p>
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-12">
        Where I&apos;ve worked
      </h2>

      <div className="flex flex-col">
        {EXPERIENCES.map((exp, i) => (
          <div
            key={exp.company}
            className={`py-8 ${i !== 0 ? "border-t border-border" : ""}`}
          >
            {/* Top row: company + period */}
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-semibold">
                  {exp.company}
                </span>
                <span className="text-xs text-black/50">· {exp.location}</span>
              </div>
              <span className="font-mono text-xs text-ink-muted shrink-0">
                {exp.period}
              </span>
            </div>

            {/* Role */}
            <p className="text-sm font-medium text-ink mb-4">{exp.role}</p>

            {/* Bullets */}
            {exp.bullets.length > 0 && (
              <ul className="flex flex-col gap-2">
                {exp.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="text-sm leading-relaxed text-ink-muted pl-4 relative before:content-['+'] before:absolute before:left-0 before:text-ink-faint"
                  >
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Awards — minimal inline strip */}
      <div className="mt-10 pt-8 border-t border-border flex flex-wrap gap-2 items-center">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-ink-faint mr-1">
          Recognition
        </span>
        {AWARDS.map((award) =>
          award.href ? (
            <a
              key={award.label}
              href={award.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] px-2.5 py-1 rounded-full border border-border text-ink-muted hover:text-ink hover:border-ink-muted transition-colors"
            >
              {award.label}
            </a>
          ) : (
            <span
              key={award.label}
              className="text-[11px] px-2.5 py-1 rounded-full border border-border text-ink-faint"
            >
              {award.label}
            </span>
          )
        )}
      </div>
    </section>
  );
}
