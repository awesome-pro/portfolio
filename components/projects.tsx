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
    tag: "Agentic RL Research",
    title: "AgentFlow-Pro",
    description:
      "Rebuilt the AgentFlow paper (ICLR 2026) from scratch as a trainable multi-agent reasoning system — a Planner→Executor→Verifier loop where only the Planner is RL-fine-tuned — and extended it with two research upgrades over the original: DAPO (Decoupled Clip + Dynamic Sampling Policy Optimization) in place of GRPO, and a Process Reward Model for step-level reward shaping. Shipped real agent tools (a sandboxed Python/SymPy executor with REPL-style output and lenient parsing, Tavily web search) and JSON-schema-constrained LLM I/O. Built a reproducible evaluation harness — AIME24 and GPQA-Diamond loaders with decontaminated train/test splits, full trajectory export, and a robust math + multiple-choice scorer — and established a measured 33% AIME24 baseline on an 8B model. Built the full RL training pipeline: an LLM-judge step-labeling stage, a Qwen3-0.6B process reward model, and a DAPO trainer on TRL + Unsloth QLoRA, including a hand-implemented dynamic-sampling stage that TRL itself does not provide. Along the way, diagnosed and fixed a 53× inference regression by tracing it to a silently-ignored decode flag and switching to the model server's native API.",
    stack: [
      "PyTorch",
      "TRL",
      "Unsloth",
      "Transformers",
      "Ollama",
      "Qwen3",
      "SymPy",
      "Pydantic",
    ],
    liveDemo: null,
    github: "https://github.com/awesome-pro/agentflow-pro",
  },
  {
    tag: "Production Agent Runtime",
    title: "GuardLoop",
    description:
      "Built a typed Python runtime guardrail for production AI agents that stops runaway loops before the next risky call runs. Shipped pre-flight, Decimal-precise caps on cost, tokens, time, and tool calls; OpenAI and Anthropic SDK wrappers; per-tool circuit breakers; a verify-fix-retry loop that feeds verifier feedback back into the agent under one shared budget; structured RunResult failures; and OpenTelemetry GenAI spans for every protected call. Added adapters that put all of it inside existing LangGraph graphs and OpenAI Agents SDK runs without rewriting the agent",
    stack: [],
    media: [
      {
        type: "image",
        src: "/projects/guardloop/cover.png",
        alt: "GuardLoop — runtime guardrails (budget caps, circuit breakers, verifier retry loop, OpenTelemetry) wrapping an AI agent loop",
      },
    ],
    liveDemo: "https://pypi.org/project/guardloop/",
    github: "https://github.com/awesome-pro/guardloop",
    links: [
      {
        label: "Docs",
        url: "https://github.com/awesome-pro/guardloop#readme",
      },
      {
        label: "PyPI",
        url: "https://pypi.org/project/guardloop/",
      },
    ],
  },
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
      "AsyncIO",
      "LiteLLM",
      "PyPI",
      "GitHub Actions",
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
        label: "PyPI",
        url: "https://pypi.org/project/orchflow/",
      },
    ],
  },
  {
    tag: "Semantic LLM Cache",
    title: "SmartMemo",
    description:
      "Built and published a Python semantic memory and caching layer for LLM agent calls, built on one thesis: cosine similarity is a useful candidate selector but not semantic equivalence. SmartMemo pairs embedding search with a learned pairwise equivalence classifier that makes the final cache-hit decision — so near-identical prompts like “approve this refund” and “deny this refund” never share a cached answer. It ships a pretrained classifier (trained on 16k+ labeled pairs across nine domains) that beats a tuned cosine baseline by +30 precision points at equal recall on a held-out gold set, so classifier-gated caching works with zero training. Also shipped: an async get_or_call facade, SQLite (WAL) persistence, FAISS vector search, explicit and opt-in implicit re-issue feedback with durable export and gated manual retraining, opt-in LLM-call retries, structured logging, a stats/training/evaluation CLI, and GitHub Actions CI across Python 3.11–3.14 with PyPI trusted publishing.",
    stack: [
      "FAISS",
      "SentenceTransformers",
      "PyTorch",
      "SQLite",
      "Pydantic",
      "NumPy",
      "GitHub Actions",
    ],
    media: [
      {
        type: "image",
        src: "/projects/smartmemo/cover.png",
        alt: "SmartMemo — semantic cache with embedding search, classifier-gated hits, and feedback export pipeline",
      },
    ],
    liveDemo: "https://pypi.org/project/smartmemo/",
    github: "https://github.com/awesome-pro/smartmemo",
    links: [
      {
        label: "PyPI",
        url: "https://pypi.org/project/smartmemo/",
      },
      {
        label: "Changelog",
        url: "https://github.com/awesome-pro/smartmemo/blob/main/CHANGELOG.md",
      },
    ],
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
