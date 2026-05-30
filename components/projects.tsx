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
}

const PROJECTS: Project[] = [
  {
    title: "AgentFlow-Pro",
    tag: "Agentic RL Research",
    stack: ["PyTorch", "TRL", "Unsloth", "Qwen3", "Ollama", "SymPy", "FastMCP"],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/agentflow-pro" },
    ],
    bullets: [
      "Rebuilt the ICLR 2026 AgentFlow paper as a local Qwen3-8B Planner→Executor→Verifier→Memory loop with JSON-schema planning, Tavily web search, and a sandboxed Python/SymPy executor.",
      "Extended the original with DAPO (replacing GRPO) and a Process Reward Model for step-level reward shaping — two research upgrades not in the paper.",
      "Built a reproducible eval harness: AIME24 and GPQA-Diamond loaders with decontaminated splits, full trajectory export, and a measured 33% AIME24 baseline on an 8B model.",
      "Shipped the full RL training pipeline: LLM-judge step labeling → Qwen3-0.6B PRM → DAPO trainer on TRL + Unsloth QLoRA, including a hand-implemented dynamic-sampling stage TRL itself does not provide.",
    ],
  },
  {
    title: "GuardLoop",
    tag: "Production Agent Runtime",
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
      className="inline-flex items-center font-mono text-xs px-2.5 py-1 rounded-full border border-border hover:border-blue-400 transition-colors"
    >
      {label} ↗
    </a>
  );
}

export default function Projects() {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto border-t border-border">
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
        Things I&apos;ve built
      </h2>

      <div className="flex flex-col">
        {PROJECTS.map((project, i) => (
          <div
            key={project.title}
            className={`py-8 ${i !== 0 ? "border-t border-border" : ""}`}
          >
            {/* Top row: title + links */}
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-1">
              <div className="flex items-center gap-2.5">
                <span className="text-base font-semibold text-ink">
                  {project.title}
                </span>
                <span className="text-xs text-black/40">· {project.tag}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {project.links.map((link) => (
                  <LinkPill key={link.label} href={link.url} label={link.label} />
                ))}
              </div>
            </div>

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
          </div>
        ))}
      </div>
    </section>
  );
}
