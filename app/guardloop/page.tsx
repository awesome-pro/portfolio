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
import CopyCommand from "@/components/projects/CopyCommand";
import GuardLoopLiveDemo from "@/components/projects/GuardLoopLiveDemo";

export const revalidate = 86400; // static content — revalidate daily

const SLUG = "guardloop";
const project = getProject(SLUG)!;
const url = `https://abhinandan.one/projects/${SLUG}`;

export const metadata: Metadata = {
  title: `${project.title} — A Guardrail Runtime for Production AI Agents | Abhinandan`,
  description: project.oneLiner,
  keywords: project.keywords,
  openGraph: {
    title: `${project.title} — A Guardrail Runtime for Production AI Agents`,
    description: project.oneLiner,
    url,
    type: "article",
    authors: ["Abhinandan"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${project.title} — A Guardrail Runtime for Production AI Agents`,
    description: project.oneLiner,
  },
  alternates: { canonical: url },
};

const BUDGETS = [
  { k: "Cost", v: "USD ceiling, Decimal-precise" },
  { k: "Tokens", v: "hard cap across the run" },
  { k: "Time", v: "wall-clock seconds" },
  { k: "Tool calls", v: "max invocations" },
];

const HIGHLIGHTS = [
  {
    title: "Pre-flight, not post-mortem",
    body: "Budgets are checked before the next risky call executes — Decimal-precise cost math means the runtime stops you at $0.092, not after the bill arrives at $0.13.",
  },
  {
    title: "Per-tool circuit breakers",
    body: "closed → open → half-open states with per-tool failure thresholds and recovery timeouts, so one flaky tool can't take the whole agent down or burn retries against a dead endpoint.",
  },
  {
    title: "Verifier feedback loop",
    body: "Output verifiers can reject a result and inject feedback via ctx.retry_feedback; the agent retries under the same shared budget — bounded self-correction, not infinite retries.",
  },
  {
    title: "OpenTelemetry GenAI spans",
    body: "Every agent run, LLM call, tool, and verifier emits a span. When something fails you get a trace and a typed RunResult with terminated_reason, not a guess.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  name: project.title,
  description: project.oneLiner,
  codeRepository: "https://github.com/awesome-pro/guardloop",
  programmingLanguage: project.programmingLanguage,
  keywords: project.keywords.join(", "),
  license: "https://opensource.org/licenses/MIT",
  runtimePlatform: "Python 3.11+",
  author: { "@type": "Person", name: "Abhinandan", url: "https://abhinandan.one" },
  mainEntityOfPage: { "@type": "WebPage", "@id": url },
};

export default function GuardLoopPage() {
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
              "Pre-flight cost / token / time / tool-call budgets",
              "Per-tool circuit breakers (closed → open → half-open)",
              "Verifier feedback retry loop under one shared budget",
              "OpenTelemetry spans + drop-in LangGraph / OpenAI Agents adapters",
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

        {/* ── Live demo ─────────────────────────────────────────────────── */}
        <section className="mb-16">
          <GuardLoopLiveDemo />
        </section>

        {/* ── The problem ───────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="The problem" title="An agent is a loop around a probabilistic system" className="mb-6" />
          <div className="flex flex-col gap-4 text-base leading-relaxed text-ink-muted">
            <p>
              When an agent goes wrong, it doesn&apos;t crash — it{" "}
              <span className="text-ink font-medium">keeps going</span>. It calls
              the same model again, retries the same dead tool, and spends real
              money doing it. By the time you notice, the failure is in the
              billing dashboard, not the logs.
            </p>
            <p>
              GuardLoop wraps the model clients and tools an agent already uses
              and enforces hard limits <em>around</em> them — so a runaway loop
              is stopped before the next expensive call, not explained after the
              fact. <span className="text-ink font-medium">No agent rewrite.</span>
            </p>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="How it works" title="A guarded execution loop" className="mb-6" />
          <PipelineDiagram
            stages={[
              {
                kicker: "pre-flight",
                title: "Budget check",
                detail:
                  "Before each LLM/tool call: would it exceed the cost, token, time, or tool-call ceiling? If so, deny and stop.",
              },
              {
                kicker: "guarded",
                title: "Call + breaker",
                detail:
                  "Run the call. A per-tool circuit breaker trips after repeated failures and short-circuits further calls.",
              },
              {
                kicker: "verify",
                title: "Verifier",
                detail:
                  "Check the output. On failure, inject feedback and retry under the same shared budget — up to max_retries.",
              },
              {
                kicker: "typed",
                title: "RunResult",
                detail:
                  "Return success, cost_usd, tokens_used, and terminated_reason — plus OpenTelemetry spans for the whole run.",
              },
            ]}
          />

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BUDGETS.map((b) => (
              <div key={b.k} className="rounded-xl border border-border bg-surface p-3.5">
                <p className="text-sm font-semibold text-ink">{b.k}</p>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">{b.v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Drop-in API ───────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="The API" title="Wrap what you already have" className="mb-6" />
          <p className="text-base leading-relaxed text-ink-muted mb-6">
            Configure budgets and breakers once, then run any async agent
            function through the runtime. Existing LangGraph graphs and OpenAI
            Agents SDK runs work through thin adapters — no rewrite.
          </p>
          <div className="flex flex-col gap-4">
            <CopyCommand
              shell={false}
              label="define the guardrails"
              lines={[
                "from guardloop import GuardLoop, BudgetConfig, is_json_object",
                "",
                "runtime = GuardLoop(",
                '    budget=BudgetConfig(cost_limit_usd="0.10", token_limit=10_000),',
                '    verifiers=[is_json_object(required_keys=["answer"])],',
                ")",
                "",
                "result = await runtime.run(agent, \"task description\")",
                "result.success, result.cost_usd, result.terminated_reason",
              ]}
            />
            <CopyCommand
              shell={false}
              label="adapt an existing LangGraph graph — no rewrite"
              lines={[
                "from guardloop.adapters.langgraph import guarded_graph",
                "",
                'agent = guarded_graph(my_compiled_graph, input_key="messages")',
                'result = await runtime.run(agent, {"messages": [...]})',
              ]}
            />
          </div>
          <div className="mt-4">
            <Callout label="bounded self-correction">
              A verifier can reject an output and pass feedback back to the agent
              via <span className="text-ink">ctx.retry_feedback</span>. The retry
              runs under the <span className="text-ink">same</span> budget — so
              self-correction can&apos;t become an infinite, expensive loop.
            </Callout>
          </div>
        </section>

        {/* ── Engineering highlights ────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="What I built" title="The details that matter in production" className="mb-6" />
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
            lines={[
              "pip install guardloop",
              'pip install "guardloop[langgraph]"',
              'pip install "guardloop[openai-agents]"',
            ]}
          />
          <p className="text-sm text-ink-faint mt-3">Python 3.11–3.13.</p>
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
