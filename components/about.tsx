export default function About() {
  return (
    <section className="mx-auto w-full max-w-3xl border-t border-border px-6 py-14">
      <div>
        <h2 className="font-mono text-xs tracking-[0.25em] text-ink-faint uppercase">
          About
        </h2>

        <div className="mt-6 flex flex-col gap-4 text-base leading-relaxed text-ink-muted">
          <p>
            Most of what I do is RL post-training on reasoning models, plus the
            inference stack around them. First make the model better, then make
            it cheap enough to actually run.
          </p>
          <p>
            The part I like is everything after the demo. Where the reasoning
            breaks, what a call costs, and what happens the first time real
            traffic hits it.
          </p>
          <p>i like working when the world is sleeping. and my work cycle is generally 12pm to 4am</p>
        </div>
      </div>
    </section>
  );
}
