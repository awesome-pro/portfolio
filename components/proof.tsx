const PROOFS = [
  {
    claim: "Designed for fault tolerance, not just happy paths",
    detail:
      "Every agent pipeline I've shipped has explicit fallback routing — if a model returns a malformed response or exceeds the latency budget, the system recovers without user impact. Built this after watching a competitor's demo break live.",
  },
  {
    claim: "Costs are a first-class concern",
    detail:
      "I track token spend per feature, not just per deployment. On [Project X], optimizing prompt structure alone cut monthly inference cost by ~[X]%. Cost decisions happen at design time, not after the bill arrives.",
  },
  {
    claim: "Observability before features",
    detail:
      "I instrument before I ship. Every production LLM call I've written emits latency, token counts, model version, and a trace ID. Debugging without this is guesswork — I've seen teams spend days on issues I can isolate in minutes.",
  },
  {
    claim: "[Architecture decision placeholder]",
    detail:
      "[One specific non-obvious architectural call you made and why — e.g., chose not to use a framework because X, or chose model Y over Z because of Z's behavior at high concurrency.]",
  },
  {
    claim: "The demo is not the product",
    detail:
      "I've rebuilt things that worked in demos and failed at [N]x load. The diff between a prototype and a production system is usually invisible until it isn't — I've learned to design for that gap from the start.",
  },
];

export default function Proof() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-border">
      <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-3">
        Depth
      </p>
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-12">
        Under the hood
      </h2>

      <div>
        {PROOFS.map((item, i) => (
          <div
            key={i}
            className="grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-4 lg:gap-8 py-6 border-b border-border last:border-b-0"
          >
            <p className="font-semibold text-ink leading-snug">{item.claim}</p>
            <p className="text-ink-muted leading-relaxed text-sm sm:text-base">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
