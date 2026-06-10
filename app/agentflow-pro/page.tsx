import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import { getProject } from "@/lib/projects";
import {
  SectionHeading,
  Chip,
  Callout,
  Stat,
  LinkBar,
} from "@/components/projects/shared";
import PipelineDiagram from "@/components/projects/PipelineDiagram";
import BenchmarkPanel, {
  type BenchmarkGroup,
} from "@/components/projects/BenchmarkPanel";
import ReplayTerminal, {
  type TraceStep,
} from "@/components/projects/ReplayTerminal";
import CopyCommand from "@/components/projects/CopyCommand";

export const revalidate = 86400; // static content — revalidate daily

const SLUG = "agentflow-pro";
const project = getProject(SLUG)!;
const url = `https://abhinandan.one/projects/${SLUG}`;

export const metadata: Metadata = {
  title: `${project.title} — Process-Supervised RL for Agentic Reasoning | Abhinandan`,
  description: project.oneLiner,
  keywords: project.keywords,
  openGraph: {
    title: `${project.title} — Process-Supervised RL for Agentic Reasoning`,
    description: project.oneLiner,
    url,
    type: "article",
    authors: ["Abhinandan"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${project.title} — Process-Supervised RL for Agentic Reasoning`,
    description: project.oneLiner,
  },
  alternates: { canonical: url },
};

/* ── Demo trace — representative, reconstructed from documented behavior.
      Swap with a real captured `main.py` run anytime. ───────────────────── */
const TRACE: TraceStep[] = [
  {
    role: "user",
    text: "If a fair coin is flipped 10 times, what is the probability of\nexactly 6 heads? Give a decimal rounded to 4 places.",
  },
  {
    role: "planner",
    action: "code",
    text: `{
  "thought": "Binomial probability: C(10,6) · 0.5^10. Compute exactly
              in Python rather than estimate, then round.",
  "action": "code",
  "action_input": "from math import comb\\nprint(round(comb(10,6)*0.5**10, 4))"
}`,
  },
  {
    role: "tool",
    action: "python",
    text: "stdout → 0.2051",
  },
  {
    role: "verifier",
    text: "State holds a computed value but no `answer` action yet.\nVerdict: CONTINUE → return to Planner.",
  },
  {
    role: "planner",
    action: "answer",
    text: `{
  "thought": "The computation returned 0.2051, which directly answers
              the question in the requested format.",
  "action": "answer",
  "action_input": "0.2051"
}`,
  },
  {
    role: "verifier",
    text: "Answer present and grounded in tool output.\nVerdict: SUFFICIENT → stop loop.",
  },
  {
    role: "answer",
    text: "0.2051",
  },
];

/* ── Benchmarks (from the repo's leakage-free, quantization-matched eval) ── */
const BENCHMARKS: BenchmarkGroup[] = [
  {
    name: "GPQA-Diamond (n=100)",
    takeaway:
      "+5.0 points on graduate-level science questions — a cross-domain gain, since the Planner was trained only on AIME math. Step count barely moved (3.09 → 3.19), so the model got more accurate, not just more verbose.",
    rows: [
      { label: "Qwen3-8B baseline", accuracy: 40.0, avgSteps: 3.09 },
      {
        label: "+ DAPO + PRM",
        accuracy: 45.0,
        avgSteps: 3.19,
        highlight: true,
      },
    ],
  },
  {
    name: "AIME 2024 (n=30)",
    takeaway:
      "On the in-domain math set the result moved within the confidence interval (±~17 pts at n=30) — 11 of 30 answers flipped in both directions. I report this as flat-within-noise rather than claiming a win: n=30 is too small to conclude either way.",
    rows: [
      { label: "Qwen3-8B baseline", accuracy: 33.3, avgSteps: 4.03 },
      {
        label: "+ DAPO + PRM",
        accuracy: 30.0,
        avgSteps: 4.37,
        highlight: true,
        note: "within ±~17pt CI · 11/30 answers flipped",
      },
    ],
  },
];

const HIGHLIGHTS = [
  {
    title: "53× serving speedup",
    body: "Ollama's /v1 endpoint silently ignores think: false; the native /api/chat endpoint honors it. Switching cut a single solve from 11m27s to ~13s.",
  },
  {
    title: "Grammar-constrained planning",
    body: "The Planner's output is locked to a Pydantic schema via Ollama's format field — every step is valid {thought, action, action_input} JSON, never free text to parse.",
  },
  {
    title: "Leakage-free evaluation",
    body: "Trained on AIME 1983–2023 (918 problems), de-duplicated against the AIME 2024 test set. The model is never trained on a problem it's later scored on.",
  },
  {
    title: "Sandboxed Python REPL",
    body: "The code tool runs in a stdlib + sympy/numpy/mpmath whitelist sandbox, auto-prints bare expressions, and tolerates lenient indentation from the model.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  name: project.title,
  description: project.oneLiner,
  codeRepository: "https://github.com/awesome-pro/agentflow-pro",
  programmingLanguage: project.programmingLanguage,
  keywords: project.keywords.join(", "),
  license: "https://opensource.org/licenses/MIT",
  author: { "@type": "Person", name: "Abhinandan", url: "https://abhinandan.one" },
  mainEntityOfPage: { "@type": "WebPage", "@id": url },
};

export default function AgentFlowProPage() {
  if (!project) notFound();

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Nav />

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <Link
          href="/projects"
          className="font-mono text-xs text-ink-muted hover:text-ink transition-colors"
        >
          ← Projects
        </Link>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <header className="mt-6 mb-14">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted mb-4">
            {project.tag}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-[1.05] mb-5">
            {project.title}
          </h1>
          <p className="text-lg sm:text-xl leading-relaxed text-ink-muted max-w-2xl mb-8">
            {project.oneLiner}
          </p>

          {project.headlineStat && (
            <div className="mb-8">
              <Stat
                value={project.headlineStat.value}
                label={project.headlineStat.label}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mb-6">
            {project.stack.map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
          </div>

          <LinkBar links={project.links} />
        </header>

        {/* ── TL;DR ─────────────────────────────────────────────────────── */}
        <section className="mb-16 border-y border-border py-6">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {[
              "Rebuilt the ICLR 2026 AgentFlow architecture from scratch",
              "Replaced outcome-only GRPO with DAPO + a learned Process Reward Model",
              "Full RL pipeline on a single A40 GPU (~$8–15)",
              "Cross-domain generalization under leakage-free evaluation",
            ].map((t) => (
              <li
                key={t}
                className="text-sm leading-relaxed text-ink-muted pl-4 relative before:content-['+'] before:absolute before:left-0 before:text-ink-faint"
              >
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* ── The problem ───────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="The problem" title="Sparse rewards can't teach a multi-step agent which step was good" className="mb-6" />
          <div className="flex flex-col gap-4 text-base leading-relaxed text-ink-muted">
            <p>
              The original AgentFlow trains its planner with{" "}
              <span className="text-ink font-medium">Flow-GRPO</span> — an
              outcome-only signal. A six-step reasoning trajectory gets a single
              reward at the end: right or wrong. If the agent solved a hard
              problem but took one wrong turn on step 3, that signal can&apos;t
              say so. Credit is smeared across every step equally.
            </p>
            <p>
              <span className="text-ink font-medium">Process supervision</span>{" "}
              scores <em>each step</em> instead. The bet: dense, per-step credit
              assignment teaches better reasoning than a single pass/fail at the
              end — even on a small model, even on a single GPU.
            </p>
          </div>
        </section>

        {/* ── Architecture ──────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="How it works" title="The agent loop" className="mb-6" />
          <p className="text-base leading-relaxed text-ink-muted mb-6">
            A <span className="text-ink font-medium">Planner → Executor → Verifier</span>{" "}
            loop with running memory. Only the Planner is trainable; everything
            else is fixed scaffolding.
          </p>

          <PipelineDiagram
            stages={[
              {
                kicker: "trainable",
                title: "Planner",
                detail:
                  "Emits grammar-constrained JSON {thought, action, action_input}, action ∈ {think, search, code, answer}.",
              },
              {
                kicker: "dispatch",
                title: "Executor",
                detail:
                  "Pure routing — Tavily web search, a sandboxed Python/SymPy REPL, or echo for think/answer.",
              },
              {
                kicker: "judge",
                title: "Verifier",
                detail:
                  "Decides whether running state is sufficient to answer, or the loop should continue.",
              },
            ]}
          />

          <div className="mt-4">
            <Callout label="loop + memory">
              The Verifier routes back to the Planner until the state is
              sufficient. In-task <span className="text-ink">Memory</span> carries
              context across steps; a Qdrant cross-episode backend is the planned
              next layer.
            </Callout>
          </div>
        </section>

        {/* ── Training pipeline ─────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="How I trained it" title="A four-phase RL pipeline" className="mb-6" />

          <PipelineDiagram
            stages={[
              {
                kicker: "Phase 1",
                title: "Collect",
                detail:
                  "Run the untrained agent on AIME training problems (max 6 steps) to gather trajectories.",
              },
              {
                kicker: "Phase 2",
                title: "Label",
                detail:
                  "A DeepSeek judge rates each step 0–1 via a calibrated rubric — 531 step labels.",
              },
              {
                kicker: "Phase 3",
                title: "Train PRM",
                detail:
                  "A Qwen3-0.6B sequence-regression head learns to predict step quality (MSE loss).",
              },
              {
                kicker: "Phase 4",
                title: "DAPO",
                detail:
                  "Train the Planner (Qwen3-8B, bf16 + LoRA) against PRM-scored rewards with dynamic sampling.",
              },
            ]}
          />

          <div className="mt-6">
            <Callout label="the part TRL doesn't ship">
              TRL gives you clip-higher, token-level loss, and overlong
              filtering — but <span className="text-ink">not dynamic sampling</span>.
              I built that stage from scratch: drop prompts where the G rollouts
              show near-zero reward variance (pstdev &lt; 1e-3), so gradient
              steps aren&apos;t wasted on prompts the model has already saturated.
            </Callout>
          </div>

          <p className="text-sm leading-relaxed text-ink-muted mt-6">
            End to end on one A40: collect → judge → train PRM → 300-step DAPO
            LoRA → GGUF export → Ollama serving, with a before/after eval held to
            the same quantization so the comparison is honest.
          </p>
        </section>

        {/* ── Demo / replay ─────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="See it run" title="One pass through the loop" className="mb-6" />
          <p className="text-base leading-relaxed text-ink-muted mb-6">
            A representative solve — Planner proposes a tool call, the Executor
            runs it, the Verifier decides whether to loop or stop. Press{" "}
            <span className="font-mono text-sm text-ink">Run</span> or step
            through it.
          </p>
          <ReplayTerminal steps={TRACE} title="agentflow-pro · main.py" />
        </section>

        {/* ── Results ───────────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="The result" title="Where the signal showed up" className="mb-6" />
          <BenchmarkPanel groups={BENCHMARKS} />
        </section>

        {/* ── Engineering highlights ────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="What I built" title="Engineering that made it work" className="mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {HIGHLIGHTS.map((h) => (
              <div
                key={h.title}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <p className="text-sm font-semibold text-ink mb-1.5">{h.title}</p>
                <p className="text-sm leading-relaxed text-ink-muted">{h.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Reproduce ─────────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="Reproduce it" title="Run the agent or the eval" className="mb-6" />
          <div className="flex flex-col gap-4">
            <CopyCommand
              label="solve a problem"
              lines={[
                "uv sync",
                "ollama pull qwen3:8b",
                'uv run python main.py "What is 15% of 240, then doubled?"',
              ]}
            />
            <CopyCommand
              label="run the benchmark"
              lines={[
                "uv sync --extra eval",
                "uv run python -m eval.run -b gpqa --limit 5 --max-steps 6",
                "uv run python -m eval.run -b aime24",
              ]}
            />
          </div>
        </section>

        {/* ── Footer links ──────────────────────────────────────────────── */}
        <section className="border-t border-border pt-8">
          <LinkBar links={project.links} />
          <p className="text-xs text-ink-faint mt-5 leading-relaxed">
            Built on ideas from the AgentFlow paper (arXiv 2510.05592) and DAPO
            (arXiv 2503.14476). MIT licensed; not affiliated with the original
            AgentFlow authors.
          </p>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted hover:text-ink transition-colors mt-6"
          >
            ← All projects
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
