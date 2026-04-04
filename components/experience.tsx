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
    role: "[Role Placeholder]",
    location: "[Location]",
    period: "Oct 2025 – Present",
    current: true,
    bullets: [
      // Add your experience details here
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
                <span className="text-base font-semibold text-accent">
                  {exp.company}
                </span>
                {exp.current && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-accent/8 text-accent border border-accent/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                    Current
                  </span>
                )}
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
    </section>
  );
}
