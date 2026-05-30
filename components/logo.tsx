import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
};

export default function Logo({ className }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="Abhinandan home"
      className={cn(
        "group inline-flex items-center gap-2 text-ink transition-opacity hover:opacity-80",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="text-primary/50 text-sm"
      >
        <span className="text-primary font-bold italic">A</span>BH
        <span className="text-primary font-bold italic">I</span>NANDAN
      </span>
    </Link>
  );
}
