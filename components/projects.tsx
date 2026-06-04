"use client";

import { useState } from "react";
import Link from "next/link";

interface ProjectLink {
  label: string;
  url: string;
}

interface Project {
  title: string;
  tag: string;
  stack: string[];
  links: ProjectLink[];
  bullets: string[];
  /** Internal route to a dedicated case-study page, if one exists. */
  caseStudy?: string;
}

const PROJECTS: Project[] = [
  {
    title: "AgentFlow-Pro",
    tag: "Agentic RL Research",
    caseStudy: "/projects/agentflow-pro",
    stack: ["PyTorch", "TRL", "DAPO", "PRM", "PEFT / LoRA", "Qwen3-8B", "Ollama", "FastMCP"],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/agentflow-pro" },
    ],
    bullets: [
      "Rebuilt the ICLR 2026 AgentFlow paper from scratch as a local Qwen3-8B Planner→Executor→Verifier→Memory agent loop — grammar-constrained JSON planning, Tavily web search, and a sandboxed Python/SymPy executor.",
      "Replaced the paper's outcome-only GRPO with DAPO and a learned Process Reward Model (Qwen3-0.6B regression head trained on DeepSeek-judge step labels) for dense per-step credit assignment — plus a from-scratch dynamic-sampling stage that TRL doesn't implement.",
      "Ran the full RL pipeline end-to-end on a A40 GPU: collect → judge 531 steps → train PRM → 300-step DAPO LoRA on Qwen3-8B (bf16) → GGUF export → Ollama serving, with leakage-free, quantization-matched before/after evaluation.",
      "Result: +5.0 pts on GPQA-Diamond (40.0%→45.0%, n=100) — a cross-domain gain from a Planner trained only on AIME math; AIME24 held flat within noise (n=30).",
    ],
  },
  {
    title: "GuardLoop",
    tag: "Production Agent Runtime",
    caseStudy: "/projects/guardloop",
    stack: ["OpenAI SDK", "Anthropic SDK", "LangGraph", "OpenTelemetry"],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/guardloop" },
      { label: "PyPI", url: "https://pypi.org/project/guardloop/" },
    ],
    bullets: [
      "Pre-flight Decimal-precise caps on cost, tokens, time, and tool calls — stops runaway agent loops before the next risky call executes.",
      "Per-tool circuit breakers and a verifier feedback retry loop that feeds corrections back into the agent under one shared budget.",
      "OpenTelemetry GenAI spans for every protected call with structured RunResult failure types for downstream handling.",
      "Drop-in adapters for LangGraph graphs and OpenAI Agents SDK runs — no agent rewrite required.",
    ],
  },
  {
    title: "SmartMemo",
    tag: "Semantic LLM Cache",
    caseStudy: "/projects/smartmemo",
    stack: ["FAISS", "SentenceTransformers", "PyTorch", "SQLite", "Pydantic"],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/smartmemo" },
      { label: "PyPI", url: "https://pypi.org/project/smartmemo/" },
    ],
    bullets: [
      "Semantic cache for LLM agents: embeddings retrieve candidates, a learned pairwise classifier decides reuse — so \"approve this refund\" and \"deny this refund\" never share a cached answer.",
      "Ships a pretrained classifier-v2 trained on 16,576 labeled pairs across 9 domains — +30 precision points at equal recall vs a tuned cosine baseline.",
      "FAISS vector search, WAL-backed SQLite persistence, implicit bad-hit detection, gated manual retraining, and CI across Python 3.11–3.14.",
    ],
  },
  {
    title: "Orchflow",
    tag: "Agent Orchestration Framework",
    caseStudy: "/projects/orchflow",
    stack: ["AsyncIO", "LiteLLM", "Pydantic"],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/orchflow" },
      { label: "PyPI", url: "https://pypi.org/project/orchflow/" },
    ],
    bullets: [
      "Dependency-free Python 3.11+ framework for readable multi-agent pipelines: sequential, parallel, conditional, and retryable flows with shared StepContext.",
      "Built-in lifecycle events, flat execution traces, human review gates, and JSON checkpoint/resume.",
      "Optional LiteLLM Agent with structured Pydantic outputs; shipped through v0.5.0 with tag-based PyPI releases.",
    ],
  },
  {
    title: "agenteval",
    tag: "LLM Evaluation Tooling",
    caseStudy: "/projects/agenteval",
    stack: ["AsyncIO", "OpenAI SDK", "Anthropic SDK", "LangChain", "Typer"],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/agenteval" },
      { label: "PyPI", url: "https://pypi.org/project/agenteval-py/" },
    ],
    bullets: [
      "Replaces brittle exact-match assertions with repeated-run pass-rate scoring — tests how reliably an agent behaves, not just whether one run looks right.",
      "Traces tool calls, timing, and steps; supports collect-then-raise behavioral assertions (call ordering, schema validation, latency bounds).",
      "OpenAI, Anthropic, and LangChain adapters; Typer CLI with JSON reports for CI gates.",
    ],
  },
];

function LinkPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center font-mono text-xs px-2.5 py-1 rounded-full border border-border hover:border-blue-400 transition-colors"
    >
      {label} ↗
    </a>
  );
}

function ProjectRow({ project, index }: { project: Project; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={index !== 0 ? "border-t border-border" : ""}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left py-5 flex items-center justify-between gap-4 group cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base font-semibold text-ink">{project.title}</span>
          <span className="text-xs text-black/40 truncate">· {project.tag}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {project.links.map((link) => (
              <LinkPill key={link.label} href={link.url} label={link.label} />
            ))}
          </div>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {/* Smooth height animation via grid trick */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="pb-6">
            {/* Stack */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-background border border-border text-ink-faint"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* Bullets */}
            <ul className="flex flex-col gap-2">
              {project.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="text-sm leading-relaxed text-ink-muted pl-4 relative before:content-['+'] before:absolute before:left-0 before:text-ink-faint"
                >
                  {bullet}
                </li>
              ))}
            </ul>

            {project.caseStudy && (
              <Link
                href={project.caseStudy}
                className="inline-flex items-center gap-1.5 mt-4 font-mono text-xs text-ink hover:underline underline-offset-4"
              >
                Read the full case study →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto border-t border-border">
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-2">
        Things I&apos;ve built
      </h2>

      <div className="flex flex-col">
        {PROJECTS.map((project, i) => (
          <ProjectRow key={project.title} project={project} index={i} />
        ))}
      </div>
    </section>
  );
}
