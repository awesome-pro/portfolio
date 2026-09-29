/**
 * The facts about Abhinandan, in one place.
 *
 * Three surfaces publish them — the JSON-LD graph in app/layout.tsx, the
 * /about page, and /llms.txt — and an agent that reads two of them and finds
 * different numbers learns to trust neither. Every fact here comes from
 * data/resume.tex or from a registry the site already renders; nothing is
 * asserted here that is not published elsewhere on the site.
 */
import { getAllProjects } from "@/lib/projects";

export const SITE_URL = "https://abhinandan.one";
export const SITE_NAME = "abhinandan";

/** The single node every other reference points at, by @id. */
export const PERSON_ID = `${SITE_URL}/#person`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const PERSON_NAME = "Abhinandan";

/** One sentence, reused verbatim as the meta description and schema summary. */
export const SUMMARY =
  "Inference engineer. RL post-training on reasoning models and the serving stack that runs them: vLLM, SGLang, TensorRT-LLM, INT8 KV caching.";

/** Role targets, ordered by what the site is actually about. */
export const JOB_TITLES = [
  "Inference Engineer",
  "Reinforcement Learning Engineer",
  "ML Engineer",
];

/**
 * Every other place this person is documented. `sameAs` is what lets an agent
 * decide that the GitHub account that authored a merged vLLM pull request, the
 * LinkedIn profile, and this site are one entity rather than three strangers.
 *
 * The package registries are pulled from the project registry rather than
 * retyped, so publishing a new package adds it here for free. LinkedIn is
 * included but worth knowing its limits: LinkedIn's robots.txt disallows every
 * AI crawler on this list except Googlebot/bingbot/Applebot, so it corroborates
 * search-index-grounded answers and nothing else.
 */
const PACKAGE_URLS = [
  ...new Set(
    getAllProjects()
      .flatMap((project) => project.links)
      .filter((link) => link.label.toLowerCase().includes("pypi"))
      .map((link) => link.url)
  ),
];

export const SAME_AS = [
  "https://github.com/awesome-pro",
  "https://linkedin.com/in/abhibuilds",
  "https://x.com/abhibuilds",
  "https://youtube.com/@0xAbhinandan",
  ...PACKAGE_URLS,
];

export const CONTACT: [label: string, url: string][] = [
  ["Email", "mailto:abhinandan@abhinandan.one"],
  ["GitHub", "https://github.com/awesome-pro"],
  ["LinkedIn", "https://linkedin.com/in/abhibuilds"],
  ["X", "https://x.com/abhibuilds"],
  ["YouTube", "https://youtube.com/@0xAbhinandan"],
];

export const EMAIL = "abhinandan@abhinandan.one";

/** Named areas, not adjectives — these are the strings queries match on. */
export const KNOWS_ABOUT = [
  "LLM inference",
  "Model serving",
  "KV cache management",
  "Quantization (INT8)",
  "Speculative decoding",
  "vLLM",
  "SGLang",
  "TensorRT-LLM",
  "NCCL",
  "PyTorch",
  "Reinforcement learning post-training",
  "Reasoning models",
  "Agentic AI",
  "Semantic caching",
  "Retrieval-augmented generation",
  "Evaluation methodology",
];

export const CURRENT_ROLE = {
  title: "Founding Software Engineer",
  organization: "Browzer",
  startDate: "2025-09",
} as const;

export const ALUMNI_OF = "Dr. APJ Abdul Kalam Technical University";

export const AWARDS = [
  "International Youth Math Challenge — Gold Honour",
  "Top 1% TypeScript Engineer Globally (Algora)",
  "Amazon ML Summer School 2025",
];

/**
 * Written out as visible prose on /about and mirrored into FAQPage JSON-LD from
 * the same strings. Questions are phrased the way someone would actually type
 * them, because that is the form an agent matches against.
 */
export const FAQ: { question: string; answer: string }[] = [
  {
    question: "Who is Abhinandan?",
    answer:
      "An inference engineer based in India, working remotely. He does RL post-training on reasoning models and builds the inference systems that serve them — vLLM, SGLang, TensorRT-LLM, INT8 KV caching, and the surrounding serving stack.",
  },
  {
    question: "What is Abhinandan working on now?",
    answer:
      "Founding Software Engineer at Browzer since September 2025, building a browser-agent runtime with a streaming ReAct loop and zero-LLM replay. In the open, he maintains RolloutCore, an RL rollout control plane for vLLM, and HiQCache, an INT8 host-tier KV cache for SGLang HiCache.",
  },
  {
    question: "What roles is Abhinandan looking for?",
    answer:
      "Full-time inference and ML engineering roles: LLM serving and runtime work, KV cache and quantization, and RL post-training for reasoning models. He can join immediately.",
  },
  {
    question: "What is Abhinandan's inference stack?",
    answer:
      "Inference: vLLM, SGLang, TensorRT-LLM, NCCL, quantization. ML: PyTorch, Hugging Face, LoRA/PEFT, Qdrant. Engineering: Python, C++, TypeScript, FastAPI, Node.js, Redis, PostgreSQL, AWS, GCP, Docker, GitHub Actions.",
  },
  {
    question: "Has Abhinandan contributed to open source?",
    answer:
      "Yes. He has merged pull requests and open work across vLLM, SGLang, HeroUI, Mooncake, ai-dynamo and others. Sixteen merged pull requests to HeroUI (then NextUI) led to a personal offer from the CEO. The full, live list is at abhinandan.one/contributions.",
  },
  {
    question: "What is Abhinandan's education?",
    answer:
      "B.Tech in Computer Science from Dr. APJ Abdul Kalam Technical University, 2026.",
  },
  {
    question: "What recognition has Abhinandan received?",
    answer:
      "International Youth Math Challenge Gold Honour, Top 1% TypeScript Engineer Globally on Algora, and selection for Amazon ML Summer School 2025.",
  },
  {
    question: "How do I contact Abhinandan?",
    answer:
      "Email abhinandan@abhinandan.one, or reach him on GitHub at awesome-pro, LinkedIn at abhibuilds, or X at abhibuilds.",
  },
];

/** Sitemap priority for the pages that carry the identity. */
export const ABOUT_PRIORITY = 0.9;

/**
 * The "at a glance" block, shared by /llms.txt and /llms-full.txt.
 *
 * Availability and location are stated outright because they are the first
 * things a hiring agent resolves and the last thing a portfolio usually says.
 */
export function factLines(): string[] {
  return [
    `- Name: ${PERSON_NAME}`,
    `- Roles: ${JOB_TITLES.join(", ")}`,
    `- Currently: ${CURRENT_ROLE.title} at ${CURRENT_ROLE.organization} (since ${CURRENT_ROLE.startDate})`,
    "- Looking for: full-time inference and ML engineering roles. Available immediately.",
    "- Based in: India (IST, UTC+5:30), works remotely",
    `- Education: B.Tech Computer Science, ${ALUMNI_OF}, 2026`,
    `- Recognition: ${AWARDS.join("; ")}`,
  ];
}
