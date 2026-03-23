import BookCallButton from "@/components/book-call-button";

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">Abhinandan</span>
        <div className="flex items-center gap-4">
          <BookCallButton variant="primary" />
        </div>
      </div>
    </header>
  );
}
