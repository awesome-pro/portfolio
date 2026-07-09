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
    title: "AgentFlow",
    tag: "Agent RL Research",
    stack: ["PyTorch", "TRL", "DAPO", "PRM", "PEFT / LoRA", "Qwen3-8B", "Ollama", "FastMCP"],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/agentflow-pro" },
      { label: "Details", url: "https://abhinandan.one/agentflow-pro/" },
    ],
    bullets: [
      "Reimplementation of the ICLR 2026 AgentFlow paper as a local Qwen3-8B Planner, Executor, Verifier, Memory loop. Grammar-constrained JSON planning, Tavily search, and a sandboxed Python + SymPy executor.",
      "Swapped the paper's outcome-only GRPO for DAPO plus a learned Process Reward Model (Qwen3-0.6B regression head, trained on 531 DeepSeek-judged step labels) to get dense per-step credit. TRL ships no dynamic-sampling stage, so I wrote one.",
      "Full pipeline on a single A40: trajectory collection, step judging, PRM training, 300-step DAPO LoRA on Qwen3-8B (bf16), GGUF export, Ollama serving.",
      "Evaluation is leakage-free & quantization-matched: trained in bf16, scored on the served GGUF. GPQA-Diamond moved 40.0% to 45.0% (n=100), a directional cross-domain gain from a planner trained only on AIME math. AIME24 held flat (n=30).",
    ],
  },
  {
    title: "GuardLoop",
    tag: "Agent Guardrail Runtime",
    stack: ["OpenAI SDK", "Anthropic SDK", "LangGraph", "OpenTelemetry"],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/guardloop" },
      { label: "Demo", url: "https://abhinandan.one/guardloop/" },
    ],
    bullets: [
      "Enforces budgets on an agent before it acts. Decimal-precise caps on cost, tokens, wall time, and tool calls, checked pre-flight, so a runaway loop halts before the next expensive call rather than after it.",
      "Per-tool circuit breakers, and a verifier retry loop that feeds corrections back to the agent under the same shared budget.",
      "OpenTelemetry GenAI spans on every protected call. Failures return typed RunResult objects instead of raising, so callers can branch on the reason.",
      "Adapters for LangGraph and the OpenAI Agents SDK. Existing agents wrap without touching their code.",
    ],
  },
  {
    title: "SmartMemo",
    tag: "Semantic LLM Cache",
    stack: ["FAISS", "SentenceTransformers", "PyTorch", "SQLite", "Pydantic"],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/smartmemo" },
      { label: "Demo", url: "https://abhinandan.one/smartmemo/" },
    ],
    bullets: [
      "Semantic cache for LLM agents. Embedding retrieval proposes candidates, then a learned pairwise classifier decides whether reuse is safe. \"Approve this refund\" never returns the cached answer for \"deny this refund.\"",
      "Ships a pretrained classifier (v2) trained on 16,576 labeled pairs across 9 domains. At equal recall it holds 30 more precision points than a tuned cosine-similarity baseline.",
      "FAISS index, WAL-backed SQLite persistence, implicit bad-hit detection from downstream signals, gated retraining, CI across Python 3.11 through 3.14.",
    ],
  },
  {
    title: "Orchflow",
    tag: "Multi-Agent Orchestration",
    stack: ["AsyncIO", "LiteLLM", "Pydantic"],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/orchflow" },
      { label: "Demo", url: "https://abhinandan.one/orchflow/" },
    ],
    bullets: [
      "Multi-agent pipeline framework for Python 3.11+ with no required dependencies. Sequential, parallel, conditional, and retryable steps share one typed StepContext.",
      "Lifecycle events, flat execution traces, human review gates, and JSON checkpoint/resume for runs that outlive the process.",
      "Optional LiteLLM-backed Agent with structured Pydantic outputs. Shipped through v0.5.0 on PyPI",
    ],
  },
  {
    title: "agenteval",
    tag: "Agent Evaluation Toolkit",
    stack: ["AsyncIO", "OpenAI SDK", "Anthropic SDK", "LangChain", "Typer"],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/agenteval" },
      { label: "Demo", url: "https://abhinandan.one/agenteval/" },
    ],
    bullets: [
      "Scores agents on pass rate over repeated runs rather than a single exact-match assertion. Agents are stochastic, so one green run is a sample of size one.",
      "Traces tool calls, step counts, and timing. Behavioral assertions collect and raise at the end: call ordering, argument schemas, latency bounds.",
      "Adapters for OpenAI, Anthropic, and LangChain. Typer CLI emits JSON reports that gate CI.",
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
    <section className="py-10 px-6 max-w-6xl mx-auto border-t border-border">
      <h2 className="text-3xl font-bold tracking-tight text-ink mb-2">
        <span className="text-primary">Projects </span>I have crafted
      </h2>

      <div className="flex flex-col">
        {PROJECTS.map((project, i) => (
          <ProjectRow key={project.title} project={project} index={i} />
        ))}
      </div>
    </section>
  );
}
