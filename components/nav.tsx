import Link from "next/link";
import Logo from "@/components/logo";

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Logo />
        <Link
          href="/artifacts"
          className="inline-flex text-sm font-medium transition-colors"
        >
          Artifacts
        </Link>
      </div>
    </header>
  );
}
