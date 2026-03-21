import BookCallButton from "@/components/book-call-button";

export default function Hero() {
  return (
    <section className="pt-24 pb-20 px-6 max-w-5xl mx-auto">
      <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-6">
        Founding Engineer · AI Systems
      </p>

      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-none text-ink mb-6">
        I build the infrastructure
        <br />
        <span className="text-ink-muted font-semibold">AI products run on.</span>
      </h1>

      <p className="text-lg sm:text-xl leading-relaxed text-ink-muted max-w-2xl mb-10">
        Multi-agent systems, LLM inference pipelines, and the unglamorous
        production work that separates demos from products.
      </p>

      <div className="flex flex-wrap gap-3">
        <BookCallButton variant="primary" />
        <a
          href="mailto:abhinandan@abhinandan.one"
          className="inline-flex items-center gap-1.5 border border-border text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:border-ink transition-colors"
        >
          abhinandan@abhinandan.one
        </a>
      </div>
    </section>
  );
}
