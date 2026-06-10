import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import { getProject } from "@/lib/projects";
import {
  SectionHeading,
  Chip,
  Stat,
  LinkBar,
} from "@/components/projects/shared";
import type { TraceStep } from "@/components/projects/ReplayTerminal";
import CopyCommand from "@/components/projects/CopyCommand";
import OrchflowLiveDemo from "@/components/projects/OrchflowLiveDemo";

export const revalidate = 86400; // static content — revalidate daily

const SLUG = "orchflow";
const project = getProject(SLUG)!;
const url = `https://abhinandan.one/projects/${SLUG}`;
const DEMO_REPO_URL = "https://github.com/awesome-pro/portfolio-service";
const ORCHFLOW_VIDEO_ID = "vmhhG8_w__I";
const ORCHFLOW_VIDEO_URL = `https://youtu.be/${ORCHFLOW_VIDEO_ID}`;
const ORCHFLOW_VIDEO_EMBED_URL =
  `https://www.youtube-nocookie.com/embed/${ORCHFLOW_VIDEO_ID}` +
  `?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1` +
  `&loop=1&playlist=${ORCHFLOW_VIDEO_ID}`;
const heroLinks = [
  ...project.links,
  { label: "Video demo", url: ORCHFLOW_VIDEO_URL },
  { label: "Live demo API", url: DEMO_REPO_URL },
];

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
    title: "Readable orchestration",
    body: "The running demo is still a normal Flow([...]) list: plan, a parallel group, synthesis, condition, finalizer.",
  },
  {
    title: "Parallel work you can inspect",
    body: "The three research agents share a parallel_group_id, so the UI can prove they fanned out and rejoined.",
  },
  {
    title: "Resume is visible",
    body: "Failure mode saves a JSON checkpoint, reloads it, and appends new traces after resume.",
  },
  {
    title: "Safe live model demo",
    body: "Visitors can adjust small inputs and model presets, while the backend enforces allowlisted models and rate limits.",
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
  subjectOf: {
    "@type": "VideoObject",
    name: "Orchflow Demo",
    description:
      "A walkthrough of Orchflow as a readable, observable, and recoverable multi-agent Python pipeline.",
    embedUrl: `https://www.youtube.com/embed/${ORCHFLOW_VIDEO_ID}`,
    url: ORCHFLOW_VIDEO_URL,
  },
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

      <main className="max-w-6xl mx-auto px-6 py-16">
        <Link
          href="/projects"
          className="font-mono text-xs text-ink-muted hover:text-ink transition-colors"
        >
          ← Projects
        </Link>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <header className="mt-6 mb-10 max-w-4xl">
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

          <LinkBar links={heroLinks} />
        </header>

        {/* ── Live demo ─────────────────────────────────────────────────── */}
        <section className="mb-16">
          <OrchflowLiveDemo fallbackTrace={TRACE} />
        </section>

        {/* ── Video walkthrough ─────────────────────────────────────────── */}
        <section className="mb-16">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Video walkthrough"
              title="Watch the complete Orchflow demo"
            />
            <a
              href={ORCHFLOW_VIDEO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-ink-muted transition-colors hover:text-ink"
            >
              Open on YouTube ↗
            </a>
          </div>
          <p className="mb-5 max-w-3xl text-base leading-relaxed text-ink-muted">
            A six-minute walkthrough of the same project story: readable Python
            steps, parallel branches, live events, retries, traces, and JSON
            checkpoint resume.
          </p>
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <div className="aspect-video w-full bg-background">
              <iframe
                className="h-full w-full"
                src={ORCHFLOW_VIDEO_EMBED_URL}
                title="Orchflow demo video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        {/* ── Proof points ──────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading
            eyebrow="What it proves"
            title="A live case for readable multi-agent workflows"
            className="mb-6"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="rounded-lg border border-border bg-surface p-5">
                <p className="text-sm font-semibold text-ink mb-1.5">{h.title}</p>
                <p className="text-sm leading-relaxed text-ink-muted">{h.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── The API / readability ─────────────────────────────────────── */}
        <section className="mb-16 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <SectionHeading
              eyebrow="The API"
              title="The backend is still plain Python"
              className="mb-5"
            />
            <p className="text-base leading-relaxed text-ink-muted">
              The portfolio UI is only a viewer. The value comes from Orchflow:
              step functions stay readable, while the framework handles fan-out,
              retries, lifecycle events, checkpoints, and resume.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <CopyCommand
              shell={false}
              label="real step function"
              lines={[
                "from orchflow import Agent, Flow, StepContext, condition, step",
                "",
                '@step(name="technical_research", retry=2)',
                "async def technical_research(input: dict, context: StepContext):",
                "    return await researcher.run(prompt, context=context)",
              ]}
            />
            <CopyCommand
              shell={false}
              label="same flow shape the demo runs"
              lines={[
                "flow = Flow([",
                "    plan,",
                "    [market_research, technical_research, risk_review],",
                "    synthesize,",
                "    condition(",
                '        when=lambda ctx: ctx.previous["quality_score"] >= 0.8,',
                "        then=publish_ready,",
                "        otherwise=revise,",
                "    ),",
                "    finalize,",
                "])",
              ]}
            />
          </div>
        </section>

        {/* ── Install ───────────────────────────────────────────────────── */}
        <section className="mb-16 max-w-4xl">
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
          <LinkBar links={heroLinks} />
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
