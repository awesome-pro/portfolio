import Image from "next/image";
import BookCallButton from "@/components/book-call-button";
import { Badge } from "./ui/badge";

export default function Hero() {
  return (
    <section className="min-h-[90vh] flex flex-col justify-center px-6 max-w-5xl mx-auto lg:flex-row lg:items-center lg:justify-between gap-12">
      <div className="flex-1 items-center">
         <Badge>
            Agentic AI Engineer
          </Badge>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-none text-ink mb-6">
          I build the infrastructure
          <br />
          <span className="text-ink-muted font-semibold">AI products run on.</span>
        </h1>

        <p className="text-lg sm:text-xl leading-relaxed text-ink-muted max-w-2xl mb-10">
          Multi-agent systems, LLM inference pipelines, and the unglamorous
          production work that separates demos from products.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <BookCallButton variant="primary" className="w-full sm:w-auto justify-center" />
          <a
            href="mailto:hi@abhinandan.one"
            className="inline-flex items-center justify-center gap-1.5 border border-border text-ink px-5 py-2.5 rounded-full text-sm font-medium hover:border-ink transition-colors w-full sm:w-auto"
          >
            hi@abhinandan.one
          </a>
        </div>
      </div>

      <div className="flex-shrink-0 lg:w-72 xl:w-80 lg:max-h-[60vh]">
        <div className="relative w-full aspect-[3/4] max-h-[50vh] lg:max-h-[60vh] rounded-2xl overflow-hidden">
          <Image
            src="/hero-photo.jpg"
            alt="Abhinandan"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
