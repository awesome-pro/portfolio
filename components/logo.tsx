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
      <span className="font-mono text-sm tracking-tight">abhinandan</span>
    </Link>
  );
}
