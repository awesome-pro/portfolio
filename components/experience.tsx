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
    period: "Sept 2025 – Present",
    current: true,
    bullets: [
      "Built Browzer's production Chrome MV3 recorder + CDP-native browser agent, achieving 95%+ precise AX/DOM element capture with iframe support, obstruction checks, and real mouse/key/upload execution.",
      "Built a smart streaming ReAct loop across FastAPI + extension with SSE tool execution, multi-tab orchestration, safe parallelism, abort/continue, and audit logs.",
      "Cut automation LLM spend by roughly 67% using compact recording traces, context-window compression, prompt caching, and model-routing across GPT-5, Claude Sonnet 4.6, and Gemini 3.1 Pro.",
      "Shipped a zero-LLM replay engine: recordings run as variable-driven tool-call templates, with a stateful AI fallback that resumes mid-run on failure instead of restarting.",
      "Shipped self-healing docs that auto-repair on UI drift — Haiku→Sonnet diff triage, LLM-free replay of intact steps, and a CDP agent that fixes only what changed.",
    ],
  },
  {
    company: "Cynos Nexus",
    role: "Software Engineer",
    location: "Noida, India",
    period: "Jan 2025 – Jul 2025",
    bullets: [
      "Shipped core features of an AI-powered real estate platform using Next.js, Nest.js, GraphQL, Redis, and GCP.",
      "Built the AI knowledge base service on FastAPI + LangChain.",
      "Integrated Google Cloud Vision + XLSX import to let users seed client databases from contact diary photos or Excel.",
      "Automated deployment infrastructure using Docker, GitHub Actions for CI/CD, and Nginx for reverse proxy/load balancing.",
    ],
  },
  {
    company: "Etkin.ai",
    role: "Contract Software Engineer",
    location: "Remote, Türkiye",
    period: "Sept 2024 – Dec 2024",
    bullets: [
      "Engineered a high-performance PDF generator using WeasyPrint, converting dynamic JSON reports to high-quality PDFs.",
      "Optimised data processing using CSV upload & Celery worker, reducing processing time by 40%.",
      "Established CI/CD pipelines with GitHub Actions and Docker on AWS EC2.",
      "Collaborated to build a LangChain and pgvector knowledge base, improving ML query accuracy by 15%.",
    ],
  },
  {
    company: "HeroUI",
    role: "Open-source Contributor",
    location: "Y Combinator S24",
    period: "Jun 2024 – Aug 2024",
    bullets: [
      "Received a personal offer from the CEO to join HeroUI (prev. NextUI) after making open-source contributions.",
      "Resolved 10+ bugs & delivered 7+ feature enhancements in core components including Calendar, Table, and Pagination.",
    ],
  },
  {
    company: "SkilledUp",
    role: "SWE Intern",
    location: "Noida, India",
    period: "Jan 2024 – Apr 2024",
    bullets: [],
  },
];

export default function Experience() {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto border-t border-border">
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
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
