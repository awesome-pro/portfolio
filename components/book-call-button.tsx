"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

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
      <Button
       className="rounded-full px-5 h-10"
        asChild
      >
        <Link href="https://cal.com/abhibuilds/30min"
          target="_blank"
          rel="noopener noreferrer">
            Book a Call
            <ArrowRight size={16} aria-hidden />
          </Link>
      </Button>
    );
  }

  return (
    <a
      href="https://cal.com/abhibuilds/30min"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 border border-border text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:border-ink transition-colors ${className}`}
    >
      Book a Call
      <ArrowRight size={16} aria-hidden />
    </a>
  );
}
