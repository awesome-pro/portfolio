import type { ReactNode } from "react";

/* ── Section heading (eyebrow + title), matches About/Proof rhythm ───────── */
export function SectionHeading({
  eyebrow,
  title,
  className = "",
}: {
  eyebrow: string;
  title: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-3">
        {eyebrow}
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
        {title}
      </h2>
    </div>
  );
}

/* ── Tech chip ───────────────────────────────────────────────────────────── */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-surface border border-border text-ink-faint">
      {children}
    </span>
  );
}

/* ── Callout box for a single sharp point ────────────────────────────────── */
export function Callout({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className="border-l-2 border-ink/30 bg-surface rounded-r-lg pl-4 pr-4 py-3 my-2">
      {label && (
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-1">
          {label}
        </p>
      )}
      <p className="text-sm leading-relaxed text-ink-muted">{children}</p>
    </div>
  );
}

/* ── Big stat ────────────────────────────────────────────────────────────── */
export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-mono text-3xl font-bold text-ink">{value}</p>
      <p className="text-sm text-ink-muted mt-1">{label}</p>
    </div>
  );
}

/* ── External link pills ─────────────────────────────────────────────────── */
export function LinkBar({
  links,
}: {
  links: { label: string; url: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center font-mono text-xs px-3 py-1.5 rounded-full border border-border text-ink hover:border-ink transition-colors"
        >
          {l.label} ↗
        </a>
      ))}
    </div>
  );
}
