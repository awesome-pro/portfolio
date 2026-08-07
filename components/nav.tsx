import Link from "next/link";
import Logo from "@/components/logo";
import ThemeToggle from "@/components/theme-toggle";
import { ArrowRight } from "lucide-react";

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <Logo />
        <div className="flex items-center gap-4">
          <Link
            href="/artifacts"
            className="flex items-center justify text-sm font-medium gap-1 transition-all text-ink-muted hover:text-ink"
          >
            Artifacts <ArrowRight className="w-4 h-4" />
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
