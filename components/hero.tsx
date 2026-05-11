import Image from "next/image";
import BookCallButton from "@/components/book-call-button";
import { Badge } from "./ui/badge";

export default function Hero() {
  return (
    <section className="mx-auto grid min-h-[90vh] max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:gap-16 lg:py-20">
      <div className="max-w-3xl">
        <Badge>
          Agentic AI Engineer
        </Badge>

        <h1 className="mt-5 mb-6 text-5xl leading-none font-bold tracking-tight text-ink sm:text-6xl lg:text-7xl">
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

      <div className="relative aspect-[3/4] w-full max-w-sm justify-self-center overflow-hidden rounded-2xl shadow-lg transition-shadow hover:shadow-xl sm:max-w-md lg:w-[22rem] lg:max-w-none lg:justify-self-end xl:w-[24rem]">
        <Image
          src="/hero.png"
          alt="Abhinandan"
          fill
          className="object-cover object-center"
          sizes="(max-width: 640px) calc(100vw - 3rem), (max-width: 1024px) 28rem, 24rem"
          preload
        />
      </div>
    </section>
  );
}
