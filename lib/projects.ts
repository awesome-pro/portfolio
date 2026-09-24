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
  /** One-line thesis, also used as the meta description for the card/index. */
  oneLiner: string;
  /** Big number shown on cards + hero. */
  headlineStat?: { value: string; label: string };
  stack: string[];
  links: ProjectLink[];
  keywords: string[];
  programmingLanguage: string[];
  /** Whether a dedicated case-study page exists (vs. linking straight to GitHub). */
  hasPage: boolean;
  /**
   * Factual completion/publish date (ISO). Feeds `lastModified` in the sitemap
   * only — it is NOT the sort key. See the note on `PROJECTS` below.
   */
  date: string;
}

/**
 * Display order, most prominent first. This array is the single source of both
 * the homepage's first three projects and the `/projects` index, so reorder it
 * here rather than sorting by `date`: the dates are factual metadata, not the
 * sort key. (They happen to run descending today; that is a coincidence of the
 * current set, not an invariant.)
 */
export const PROJECTS: ProjectMeta[] = [
  {
    slug: "rolloutcore",
    title: "RolloutCore",
    tag: "",
    oneLiner:
      "Versioned RL rollout runtime for vLLM with NCCL hot weight updates, version-pure rollouts, and cache-coherent transitions.",
    stack: [
      "PyTorch",
      "NCCL",
      "vLLM",
      "RL",
    ],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/rolloutcore" },
    ],
    keywords: [
      "LLM inference",
      "serving runtime",
      "continuous batching",
      "chunked prefill",
      "paged attention",
      "KV cache",
      "prefix caching",
      "preemption",
      "request scheduling",
      "vLLM",
      "TTFT",
      "throughput",
    ],
    programmingLanguage: ["Python"],
    hasPage: false,
    date: "2026-09-23",
  },
  {
    slug: "miniserve",
    title: "MiniServe",
    tag: "LLM Inference Runtime",
    oneLiner:
      "a from-scratch LLM serving runtime with continuous batching, chunked prefill, block-based KV management, preemption, and prefix caching.",
    headlineStat: {
      value: "97%",
      label: "of prefill work removed by prefix caching · ≤6e-8 logit delta vs HF",
    },
    stack: [
      "Python 3.12",
      "PyTorch",
      "Paged KV Cache",
      "Continuous Batching",
      "Prefix Caching",
    ],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/miniserve" },
    ],
    keywords: [
      "LLM inference",
      "serving runtime",
      "continuous batching",
      "chunked prefill",
      "paged attention",
      "KV cache",
      "prefix caching",
      "preemption",
      "request scheduling",
      "vLLM",
      "TTFT",
      "throughput",
    ],
    programmingLanguage: ["Python"],
    hasPage: false,
    date: "2026-09-23",
  },
  {
    slug: "agentflow-pro",
    title: "AgentFlow-Pro",
    tag: "Agentic RL Research",
    oneLiner:
      "Process-supervised RL that made an 8B model reason better, and the gain carried over to a domain it never trained on.",
    headlineStat: { value: "+5.0 pts", label: "GPQA-Diamond · 40.0 → 45.0%" },
    stack: ["PyTorch", "TRL", "DAPO", "PRM", "PEFT / LoRA", "Qwen3-8B", "Ollama", "FastMCP"],
    links: [
      { label: "GitHub", url: "https://github.com/awesome-pro/agentflow-pro" },
      { label: "Original AgentFlow paper", url: "https://arxiv.org/abs/2510.05592" },
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
    slug: "smartmemo",
    title: "SmartMemo",
    tag: "Semantic LLM Cache",
    oneLiner:
      "A semantic cache for LLM agents where a trained classifier decides if a cached answer is safe to reuse, instead of raw cosine similarity.",
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

/** Slugs that have a dedicated case-study page, used for the sitemap. */
export function getPagedProjectSlugs(): string[] {
  return PROJECTS.filter((p) => p.hasPage).map((p) => p.slug);
}
