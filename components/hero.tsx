const LINKS = [
  { label: "x", href: "https://x.com/abhibuilds" },
  { label: "email", href: "mailto:abhinandan@abhinandan.one" },
  { label: "github", href: "https://github.com/awesome-pro" },
  { label: "youtube", href: "https://youtube.com/@0xAbhinandan" },
];

export default function Hero() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 pt-20 pb-16 sm:pt-24">
  
      <h1 className="mt-6 text-4xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-5xl">
        Abhinandan
      </h1>

      <p className="mt-7 text-base leading-relaxed text-ink-muted">
        I do <strong>RL post-training</strong> on reasoning models, & build
        the <strong>inference systems</strong> that serve them. And I usually write my thoughts in my artifacts.
      </p>

      <nav
        aria-label="Elsewhere"
        className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs"
      >
        {LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="text-ink-muted transition-colors hover:text-ink"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </section>
  );
}
