"use client";

import { useState } from "react";

interface MediaItem {
  type: "image" | "video";
  src: string;
  alt?: string;
}

interface ProjectLink {
  label: string;
  url: string;
}

interface Project {
  tag: string;
  title: string;
  description: string;
  stack: string[];
  liveDemo: string | null;
  github: string | null;
  links?: ProjectLink[];
  media?: MediaItem[];
}

const PROJECTS: Project[] = [
  {
    tag: "LLM Evaluation Tooling",
    title: "agenteval",
    description:
      "Built and published a Python CLI/package for testing LLM agents with repeated-run reliability scoring instead of brittle exact-match assertions. Shipped tool-call tracing, behavioral assertions (tool usage, ordering, schema, timing), OpenAI/Anthropic adapters, realistic live eval examples, JSON reporting, CI/CD, and a public PyPI release.",
    stack: [],
    media: [
      {
        type: "image",
        src: "/projects/agenteval/demo.png",
        alt: "Demo of agenteval in action",
      },
      {
        type: "image",
        src: "/projects/agenteval/examples.png",
        alt: "Examples",
      },
      {
        type: "image",
        src: "/projects/agenteval/failure-demo.png",
        alt: "Failure demo",
      },
      {
        type: "image",
        src: "/projects/agenteval/architecture.png",
        alt: "Architecture",
      },
    ],
    liveDemo: "https://pypi.org/project/agenteval-py/",
    github: "https://github.com/awesome-pro/agenteval",
    links: [{ label: "PyPI", url: "https://pypi.org/project/agenteval-py/" }],
  },
  {
    tag: "Agent Orchestration Framework",
    title: "Orchflow",
    description:
      "Created and published a dependency-free Python 3.11+ framework for readable multi-agent pipelines. Shipped sequential, parallel, conditional, retryable, and observable flows, plus human review gates, JSON checkpoint/resume, structured Agent outputs, offline tests, and tag-based PyPI releases through v0.5.0.",
    stack: [
      "Python",
      "AsyncIO",
      "LiteLLM",
      "PyPI",
      "GitHub Actions",
      "Pytest",
      "Ruff",
      "Pyright",
    ],
    media: [
      {
        type: "image",
        src: "/projects/orchflow/architecture.svg",
        alt: "Orchflow architecture and shipped framework capabilities",
      },
    ],
    liveDemo: "https://pypi.org/project/orchflow/",
    github: "https://github.com/awesome-pro/orchflow",
    links: [
      {
        label: "Docs",
        url: "https://github.com/awesome-pro/orchflow#readme",
      },
      {
        label: "v0.5.0",
        url: "https://github.com/awesome-pro/orchflow/releases/tag/v0.5.0",
      },
    ],
  },
  {
    tag: "Inference Engineering",
    title: "Low-Latency Inference Layer",
    description:
      "Architected a caching and batching layer in front of foundation model endpoints. Achieved [X]ms median cold-start and [X]% cache hit rate in production, cutting inference costs by ~[X]%.",
    stack: ["Python", "Docker", "Redis", "AWS"],
    liveDemo: null,
    github: null,
  },
  {
    tag: "Full-Stack AI Product",
    title: "NewTools",
    description:
      "Built a free, privacy-focused browser utility platform from scratch. Features AI-powered PDF-to-CSV extraction (Claude API with SSE streaming), a shared daily credit system, Supabase auth, and a suite of client-side tools — all with zero data sent to the server.",
    stack: ["Next.js", "TypeScript", "FastAPI", "Claude API", "Supabase"],
    liveDemo: "https://newtools.space",
    github: null,
  },
];

function MediaCarousel({ media }: { media: MediaItem[] }) {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i - 1 + media.length) % media.length);
  const next = () => setIndex((i) => (i + 1) % media.length);

  const current = media[index];

  return (
    <div className="relative w-full aspect-video bg-background rounded-xl overflow-hidden mb-4 group">
      {current.type === "video" ? (
        <video
          src={current.src}
          className="w-full h-full object-cover"
          controls
          playsInline
          preload="metadata"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current.src}
          alt={current.alt ?? "Project media"}
          className="w-full h-full object-cover"
        />
      )}

      {media.length > 1 && (
        <>
          {/* Arrows */}
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 border border-border flex items-center justify-center text-ink-muted hover:text-ink transition-opacity opacity-0 group-hover:opacity-100"
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 border border-border flex items-center justify-center text-ink-muted hover:text-ink transition-opacity opacity-0 group-hover:opacity-100"
            aria-label="Next"
          >
            ›
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {media.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === index ? "bg-ink" : "bg-ink/30"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LinkPill({
  href,
  label,
  disabled,
}: {
  href: string | null;
  label: string;
  disabled?: boolean;
}) {
  if (disabled || !href) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-full border border-border text-ink-faint cursor-not-allowed select-none">
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-full border border-border text-ink-muted hover:border-ink-muted hover:text-ink transition-colors"
    >
      {label} ↗
    </a>
  );
}

export default function Projects() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto border-t border-border">
      <p className="text-xs font-semibold tracking-widest uppercase text-ink-muted mb-3">
        Work
      </p>
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-12">
        Things I&apos;ve built
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {PROJECTS.map((project) => (
          <div
            key={project.title}
            className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4 hover:border-ink-muted transition-colors"
          >
            {/* Media carousel */}
            {project.media && project.media.length > 0 && (
              <MediaCarousel media={project.media} />
            )}

            {/* Header */}
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-ink-faint mb-2">
                {project.tag}
              </p>
              <h3 className="text-lg font-semibold text-ink leading-snug">
                {project.title}
              </h3>
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed text-ink-muted flex-1">
              {project.description}
            </p>

            {/* Stack */}
            <div className="flex flex-wrap gap-1.5">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  className="font-mono text-xs px-2.5 py-1 rounded-full bg-background border border-border text-ink-muted"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-border">
              <LinkPill
                href={project.liveDemo}
                label="Live Demo"
                disabled={!project.liveDemo}
              />
              <LinkPill
                href={project.github}
                label="GitHub"
                disabled={!project.github}
              />
              {project.links?.map((link) => (
                <LinkPill key={link.label} href={link.url} label={link.label} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
