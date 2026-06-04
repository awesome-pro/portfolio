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
import ReplayTerminal, {
  type TraceStep,
} from "@/components/projects/ReplayTerminal";
import CopyCommand from "@/components/projects/CopyCommand";

export const revalidate = 86400; // static content — revalidate daily

const SLUG = "orchflow";
const project = getProject(SLUG)!;
const url = `https://abhinandan.one/projects/${SLUG}`;

export const metadata: Metadata = {
  title: `${project.title} — Dependency-Free Multi-Agent Pipeline Orchestration | Abhinandan`,
  description: project.oneLiner,
  keywords: project.keywords,
  openGraph: {
    title: `${project.title} — Dependency-Free Multi-Agent Pipeline Orchestration`,
    description: project.oneLiner,
    url,
    type: "article",
    authors: ["Abhinandan"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${project.title} — Dependency-Free Pipeline Orchestration`,
    description: project.oneLiner,
  },
  alternates: { canonical: url },
};

/* ── Demo trace — a parallel fan-out flow's live event stream.
      Representative; swap with a real captured run anytime. ─────────────── */
const TRACE: TraceStep[] = [
  {
    role: "user",
    label: "RUN",
    text: 'await flow.run("transformers vs. RNNs")',
  },
  { role: "verifier", label: "EVENT", action: "flow_started", text: "content-pipeline · 1 input item" },
  {
    role: "tool",
    label: "STEP",
    action: "plan ✓",
    text: "step_completed   →   outline: [background, mechanism, tradeoffs]",
  },
  {
    role: "planner",
    label: "PARALLEL",
    action: "fan-out",
    text: "step_started  web_research  ‖  docs_research   (run concurrently)",
  },
  {
    role: "tool",
    label: "STEP",
    action: "merge ✓",
    text: 'both completed → next step receives\n{"web_research": "…", "docs_research": "…"}',
  },
  {
    role: "tool",
    label: "STEP",
    action: "synthesize ✓",
    text: "step_completed   →   final draft assembled",
  },
  {
    role: "answer",
    label: "RESULT",
    text: `FlowResult(
    success=True,
    output="<final draft>",
    traces=[plan, web_research, docs_research, synthesize],
)`,
  },
];

const HIGHLIGHTS = [
  {
    title: "Zero runtime dependencies",
    body: "The core is pure standard-library Python — nothing to pin, audit, or break on upgrade. LiteLLM is pulled in only if you opt into the optional Agent.",
  },
  {
    title: "Steps are just functions",
    body: "An @step is a normal async function taking (input, context). No nodes, no graph DSL — you read the pipeline top to bottom like the code it is.",
  },
  {
    title: "Flat traces, live events",
    body: "Every attempt emits a StepTrace; flow_started → step_completed → retry_scheduled → flow_completed stream live via flow.events(...). Observability without a backend.",
  },
  {
    title: "Checkpoint, resume, and gate",
    body: "JsonCheckpointStore saves after each top-level item, so flow.resume() picks up a failed run. human_input() adds a review gate with no separate UI or queue.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  name: project.title,
  description: project.oneLiner,
  codeRepository: "https://github.com/awesome-pro/orchflow",
  programmingLanguage: project.programmingLanguage,
  keywords: project.keywords.join(", "),
  license: "https://opensource.org/licenses/MIT",
  runtimePlatform: "Python 3.11+",
  softwareVersion: "0.5.0",
  author: { "@type": "Person", name: "Abhinandan", url: "https://abhinandan.one" },
  mainEntityOfPage: { "@type": "WebPage", "@id": url },
};

export default function OrchflowPage() {
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
              "Sequential, parallel, conditional & retryable flows",
              "Shared StepContext, flat traces, live lifecycle events",
              "JSON checkpoint / resume + lightweight human-review gates",
              "Zero core dependencies; optional LiteLLM Agent with structured output",
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
          <SectionHeading eyebrow="The problem" title="Between fragile function-chaining and heavy graph runtimes" className="mb-6" />
          <div className="flex flex-col gap-4 text-base leading-relaxed text-ink-muted">
            <p>
              Chaining a few async functions is fine — until the pipeline needs{" "}
              <span className="text-ink font-medium">retries, parallel work,
              branching, shared state, or traces</span>. Then the glue code grows
              faster than the logic.
            </p>
            <p>
              Full graph frameworks solve that, but they ask you to rebuild your
              workflow as nodes and edges in their runtime. Orchflow sits in the
              middle: you write <span className="text-ink font-medium">normal
              Python functions</span>, and it handles the orchestration mechanics
              — with nothing to install but itself.
            </p>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="How it works" title="Compose functions into a Flow" className="mb-6" />
          <PipelineDiagram
            stages={[
              {
                kicker: "decorate",
                title: "@step",
                detail:
                  "Write async functions taking (input, context). Add retry= per step. Sync functions run on worker threads.",
              },
              {
                kicker: "compose",
                title: "Flow([...])",
                detail:
                  "List steps to run in order; nest a list to fan out in parallel; use condition() to branch.",
              },
              {
                kicker: "execute",
                title: "run / resume",
                detail:
                  "Run with retries and a checkpoint store; resume() picks up where a failed run stopped.",
              },
              {
                kicker: "observe",
                title: "FlowResult",
                detail:
                  "Get output, shared state, success, and a flat list of StepTrace records — plus live events.",
              },
            ]}
          />
        </section>

        {/* ── The API / readability ─────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="The API" title="The pipeline reads like the work" className="mb-6" />
          <div className="flex flex-col gap-4">
            <CopyCommand
              shell={false}
              label="a step is a normal async function"
              lines={[
                "from orchflow import Flow, StepContext, step, condition",
                "",
                '@step(name="research", retry=2)',
                "async def research(input: str, context: StepContext) -> str:",
                '    context.state["topic"] = input',
                '    return f"findings about {input}"',
              ]}
            />
            <CopyCommand
              shell={false}
              label="sequential, parallel (nested list), conditional"
              lines={[
                "flow = Flow([",
                "    plan,",
                "    [web_research, docs_research],   # run concurrently",
                "    condition(",
                '        when=lambda ctx: ctx.previous == "technical",',
                "        then=technical_writer,",
                "        otherwise=general_writer,",
                "    ),",
                "])",
                'result = await flow.run("transformers vs. RNNs")',
              ]}
            />
          </div>
          <div className="mt-4">
            <Callout label="resilience, built in">
              <span className="text-ink">JsonCheckpointStore</span> saves after
              each completed item; if a run fails,{" "}
              <span className="text-ink">await flow.resume(store)</span> continues
              from there. <span className="text-ink">human_input()</span> drops a
              review gate into the flow with no separate UI or queue.
            </Callout>
          </div>
        </section>

        {/* ── Demo ──────────────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="See it run" title="A parallel flow's live event stream" className="mb-6" />
          <p className="text-base leading-relaxed text-ink-muted mb-6">
            <span className="font-mono text-sm text-ink">flow.events(...)</span>{" "}
            yields lifecycle events as the pipeline executes — plan, a concurrent
            fan-out, a merge, then synthesis.
          </p>
          <ReplayTerminal steps={TRACE} title="orchflow · content-pipeline" />
        </section>

        {/* ── Engineering highlights ────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="What I built" title="Lightweight on purpose" className="mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="rounded-xl border border-border bg-surface p-5">
                <p className="text-sm font-semibold text-ink mb-1.5">{h.title}</p>
                <p className="text-sm leading-relaxed text-ink-muted">{h.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Install ───────────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="Get started" title="Install from PyPI" className="mb-6" />
          <CopyCommand
            label="pip"
            lines={["pip install orchflow", 'pip install "orchflow[litellm]"']}
          />
          <p className="text-sm text-ink-faint mt-3">
            v0.5.0 · tag-based PyPI releases · core has zero runtime dependencies.
          </p>
        </section>

        {/* ── Footer links ──────────────────────────────────────────────── */}
        <section className="border-t border-border pt-8">
          <LinkBar links={project.links} />
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
