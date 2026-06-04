// Central registry for project case-study pages.
// Drives: /projects index cards, sitemap entries, JSON-LD, and homepage links.
// Each project with `hasPage: true` has a dedicated TSX page at app/projects/<slug>/page.tsx.

export interface ProjectLink {
  label: string;
  url: string;
}

export interface ProjectMeta {
  slug: string;
  title: string;
  tag: string;
  /** One-line thesis — also used as the meta description for the card/index. */
  oneLiner: string;
  /** Big number shown on cards + hero. */
  headlineStat?: { value: string; label: string };
  stack: string[];
  links: ProjectLink[];
  keywords: string[];
  programmingLanguage: string[];
  /** Whether a dedicated case-study page exists (vs. linking straight to GitHub). */
  hasPage: boolean;
  /** Used for sitemap lastmod + index ordering (ISO date). */
  date: string;
}

export const PROJECTS: ProjectMeta[] = [
  {
    slug: "agentflow-pro",
    title: "AgentFlow-Pro",
    tag: "Agentic RL Research",
    oneLiner:
      "Process-supervised RL that taught an 8B model to reason better — and the gain transferred to a domain it never trained on.",
    headlineStat: { value: "+5.0 pts", label: "GPQA-Diamond · 40.0 → 45.0%" },
    stack: ["PyTorch", "TRL", "DAPO", "PRM", "PEFT / LoRA", "Qwen3-8B", "Ollama", "FastMCP"],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/agentflow-pro" },
      { label: "AgentFlow paper", url: "https://arxiv.org/abs/2510.05592" },
      { label: "DAPO paper", url: "https://arxiv.org/abs/2503.14476" },
    ],
    keywords: [
      "AgentFlow",
      "process reward model",
      "DAPO",
      "reinforcement learning",
      "agentic reasoning",
      "Qwen3",
      "LoRA fine-tuning",
      "GPQA",
      "AIME",
      "RLHF",
    ],
    programmingLanguage: ["Python"],
    hasPage: true,
    date: "2026-05-20",
  },
  {
    slug: "guardloop",
    title: "GuardLoop",
    tag: "Production Agent Runtime",
    oneLiner:
      "A guardrail runtime for async agents: pre-flight cost/token/time budgets, per-tool circuit breakers, and OpenTelemetry spans — no agent rewrite.",
    headlineStat: { value: "0", label: "agent rewrites — drop-in adapters" },
    stack: ["OpenAI SDK", "Anthropic SDK", "LangGraph", "OpenTelemetry"],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/guardloop" },
      { label: "PyPI", url: "https://pypi.org/project/guardloop/" },
    ],
    keywords: [
      "LLM guardrails",
      "agent runtime",
      "OpenTelemetry",
      "circuit breaker",
      "token budget",
      "cost limit",
      "LangGraph",
      "OpenAI Agents SDK",
      "production AI agents",
    ],
    programmingLanguage: ["Python"],
    hasPage: true,
    date: "2026-04-10",
  },
  {
    slug: "smartmemo",
    title: "SmartMemo",
    tag: "Semantic LLM Cache",
    oneLiner:
      "A semantic cache for LLM agents where a learned classifier — not raw cosine similarity — decides when a cached answer is safe to reuse.",
    headlineStat: { value: "+30 pts", label: "precision at equal recall vs. cosine" },
    stack: ["FAISS", "SentenceTransformers", "PyTorch", "SQLite", "Pydantic"],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/smartmemo" },
      { label: "PyPI", url: "https://pypi.org/project/smartmemo/" },
    ],
    keywords: [
      "semantic cache",
      "LLM cache",
      "FAISS",
      "embeddings",
      "sentence-transformers",
      "pairwise classifier",
      "semantic equivalence",
      "prompt caching",
      "MiniLM",
    ],
    programmingLanguage: ["Python"],
    hasPage: true,
    date: "2026-03-15",
  },
  {
    slug: "orchflow",
    title: "Orchflow",
    tag: "Agent Orchestration Framework",
    oneLiner:
      "A dependency-free Python framework for readable multi-agent pipelines: sequential, parallel, conditional, and resumable flows.",
    headlineStat: { value: "0 deps", label: "zero runtime dependencies in core" },
    stack: ["AsyncIO", "LiteLLM", "Pydantic"],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/orchflow" },
      { label: "PyPI", url: "https://pypi.org/project/orchflow/" },
    ],
    keywords: [
      "multi-agent",
      "orchestration",
      "asyncio",
      "pipeline",
      "LiteLLM",
      "workflow framework",
      "checkpoint resume",
      "dependency-free",
    ],
    programmingLanguage: ["Python"],
    hasPage: true,
    date: "2026-02-20",
  },
  {
    slug: "agenteval",
    title: "agenteval",
    tag: "LLM Evaluation Tooling",
    oneLiner:
      "Behavioral eval for agents: replaces brittle exact-match asserts with repeated-run pass-rate scoring for CI gates.",
    headlineStat: { value: "pass-rate", label: "statistical scoring, not assert-equals" },
    stack: ["AsyncIO", "OpenAI SDK", "Anthropic SDK", "LangChain", "Typer"],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/agenteval" },
      { label: "PyPI", url: "https://pypi.org/project/agenteval-py/" },
    ],
    keywords: [
      "agent evaluation",
      "LLM testing",
      "pass rate",
      "CI",
      "behavioral assertions",
      "agent tracing",
      "non-deterministic testing",
      "regression tracking",
    ],
    programmingLanguage: ["Python"],
    hasPage: true,
    date: "2026-01-25",
  },
];

export function getAllProjects(): ProjectMeta[] {
  return PROJECTS;
}

export function getProject(slug: string): ProjectMeta | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

/** Slugs that have a dedicated case-study page — used for the sitemap. */
export function getPagedProjectSlugs(): string[] {
  return PROJECTS.filter((p) => p.hasPage).map((p) => p.slug);
}
