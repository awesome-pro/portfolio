const STATS = [
  { value: "2 yrs", label: "founding engineer experience" },
  { value: "3+", label: "AI products shipped to production" },
  { value: "[N]", label: "agents in a single pipeline" },
  { value: "[N]M+", label: "LLM calls monitored in production" },
];

export default function About() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-border">
      <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-3">
        About
      </p>
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-12">
        ~2 years building at the edge
        <br />
        of what&apos;s possible with AI.
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-12">
        {/* Prose */}
        <div className="flex flex-col gap-5 text-base sm:text-lg leading-relaxed text-ink-muted">
          <p>
            I joined{" "}
            <span className="text-ink font-medium">
              [Company/Project Placeholder]
            </span>{" "}
            early — before the team had process, before the architecture was
            decided, before anyone was sure it would work. That meant writing
            production code and making calls that stuck.
          </p>
          <p>
            Most of my work lives at the intersection of language models and
            real software: figuring out where a model&apos;s reasoning breaks
            down, designing systems that degrade gracefully when it does, and
            shipping things that work on a Tuesday at 3am.
          </p>
          <p>
            I care about the unsexy parts — latency budgets, error surfaces,
            cost models, observability. The parts that don&apos;t make it into
            the demo but determine whether the product survives contact with
            users.
          </p>
          <p className="text-sm text-ink-faint mt-2">
            Currently open to select projects · [CITY_PLACEHOLDER]
          </p>
          <a
            href="[RESUME_URL]"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors self-start mt-1"
          >
            View Resume →
          </a>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-8">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <p className="font-mono text-3xl font-bold text-ink">
                {stat.value}
              </p>
              <p className="text-sm text-ink-muted mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
