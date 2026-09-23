import Logo from "@/components/logo";
import ThemeToggle from "@/components/theme-toggle";
import ViewToggle from "@/components/view-toggle";

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-4 px-6">
        <Logo />
        <div className="flex items-center gap-4 sm:gap-5">
          <ViewToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
