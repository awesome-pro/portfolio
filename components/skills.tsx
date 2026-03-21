const SKILLS = [
  {
    label: "AI / ML Systems",
    items: [
      "Claude API",
      "Multi-Agent Orchestration",
      "LLM Monitoring",
      "Inference Engineering",
      "RAG Pipelines",
      "Multi-LLM Routing",
      "Prompt Engineering",
    ],
  },
  {
    label: "Languages & Frameworks",
    items: ["TypeScript", "Python", "React", "Next.js", "Flask", "Node.js"],
  },
  {
    label: "Infrastructure",
    items: ["Docker", "GCP", "AWS", "REST APIs", "PostgreSQL", "Redis"],
  },
];

export default function Skills() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-border">
      <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-3">
        Stack
      </p>
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-12">
        What I work with
      </h2>

      <div className="flex flex-col gap-10">
        {SKILLS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold tracking-widest uppercase text-ink-faint mb-4">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span
                  key={item}
                  className="font-mono text-xs px-3 py-1.5 rounded-full bg-surface border border-border text-ink"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
