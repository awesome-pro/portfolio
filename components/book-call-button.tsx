"use client";

interface BookCallButtonProps {
  variant?: "primary" | "ghost";
  className?: string;
}

export default function BookCallButton({
  variant = "primary",
  className = "",
}: BookCallButtonProps) {
  if (variant === "primary") {
    return (
      <a
        href="https://cal.com/awesome-v0/15min"
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 bg-accent text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-accent-hover transition-colors ${className}`}
      >
        Book a Call
        <span aria-hidden>→</span>
      </a>
    );
  }

  return (
    <a
      href="https://cal.com/awesome-v0/15min"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 border border-border text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:border-ink transition-colors ${className}`}
    >
      Book a Call
      <span aria-hidden>→</span>
    </a>
  );
}
