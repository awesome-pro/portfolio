interface Experience {
  company: string;
  role: string;
  location: string;
  period: string;
  note?: string;
}

const EXPERIENCES: Experience[] = [
  {
    company: "Browzer",
    role: "Founding Software Engineer",
    location: "San Francisco",
    period: "2025 to now",
    note: "role just ended",
  },
  {
    company: "Cynos Nexus",
    role: "Founding Software Engineer",
    location: "Noida",
    period: "2025",
  },
  {
    company: "Etkin.ai",
    role: "Contract Software Engineer",
    location: "Türkiye",
    period: "2024",
  },
  {
    company: "HeroUI",
    role: "Open Source Contributor",
    location: "YC S24",
    period: "2024",
  },
];

const ACTIVITY = [
  "Amazon ML Summer School 2025",
  "IYMC Gold Honour",
  "Top 1% TypeScript Engineer, Algora",
];

export default function Experience() {
  return (
    <section className="mx-auto w-full max-w-3xl border-t border-border px-6 py-14">
      <div>
        <h2 className="font-mono text-xs tracking-[0.25em] text-ink-faint uppercase">
          Work
        </h2>

        <div className="mt-6 flex flex-col">
          {EXPERIENCES.map((exp, index) => (
            <div
              key={exp.company}
              className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4 ${
                index !== 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-base font-medium text-ink">
                  {exp.company}
                </span>
                <span className="text-sm text-ink-muted">{exp.role}</span>
                <span className="font-mono text-xs text-ink-faint">
                  {exp.location}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-ink-faint">
                  {exp.period}
                </span>
                {exp.note && (
                  <span className="rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10px] text-ink-muted">
                    {exp.note}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 border-t border-border pt-6 font-mono text-xs leading-relaxed text-ink-faint">
          {ACTIVITY.join("  ·  ")}
        </p>
      </div>
    </section>
  );
}
