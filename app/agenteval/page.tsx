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
import AgentEvalLiveDemo from "@/components/projects/AgentEvalLiveDemo";

export const revalidate = 86400; // static content — revalidate daily

const SLUG = "agenteval";
const project = getProject(SLUG)!;
const url = `https://abhinandan.one/projects/${SLUG}`;

export const metadata: Metadata = {
  title: `${project.title} — Pass-Rate Behavioral Testing for LLM Agents | Abhinandan`,
  description: project.oneLiner,
  keywords: project.keywords,
  openGraph: {
    title: `${project.title} — Pass-Rate Behavioral Testing for LLM Agents`,
    description: project.oneLiner,
    url,
    type: "article",
    authors: ["Abhinandan"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${project.title} — Pass-Rate Behavioral Testing for LLM Agents`,
    description: project.oneLiner,
  },
  alternates: { canonical: url },
};

const HIGHLIGHTS = [
  {
    title: "Pass-rate, not pass/fail",
    body: "An agent that's right 85% of the time is a known quantity; a single run that happens to pass is luck. Tests assert a reliability threshold over N runs, so you can track regressions instead of chasing flakes.",
  },
  {
    title: "Collect-then-raise assertions",
    body: "A fluent assert_that() chain gathers every failure across the run before raising — so one failed expectation doesn't hide the other three. You see the whole picture per run, not just the first crash.",
  },
  {
    title: "Behavioral, not string-matching",
    body: "Assert on what the agent did: called_tool, tool_call_count(min/max), completed_within_steps/seconds, response_matches_schema, no_errors — the trace, not the exact wording.",
  },
  {
    title: "CI-native, framework-agnostic",
    body: "Typer CLI with JSON reports and exit codes (0 pass / 1 fail / 2 error). OpenAI, Anthropic, and LangChain adapters wrap existing tools without changing the agent.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  name: project.title,
  description: project.oneLiner,
  codeRepository: "https://github.com/awesome-pro/agenteval",
  programmingLanguage: project.programmingLanguage,
  keywords: project.keywords.join(", "),
  license: "https://opensource.org/licenses/MIT",
  runtimePlatform: "Python 3.11+",
  author: { "@type": "Person", name: "Abhinandan", url: "https://abhinandan.one" },
  mainEntityOfPage: { "@type": "WebPage", "@id": url },
};

export default function AgentEvalPage() {
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
        <header className="mt-6 mb-14 max-w-4xl">
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
              "Run a test N times; pass if the success rate clears a threshold",
              "Collect-then-raise behavioral assertions on the agent's trace",
              "Traces every tool call — name, args, result, timing, steps",
              "Typer CLI with JSON reports + exit codes for CI gates",
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

        {/* ── Demo ──────────────────────────────────────────────────────── */}
        <section className="mb-16 w-full">
          <SectionHeading eyebrow="Live demo" title="Run a real pass-rate gate" className="mb-6" />
          <AgentEvalLiveDemo />
        </section>

        {/* ── The problem ───────────────────────────────────────────────── */}
        <section className="mb-16 max-w-4xl">
          <SectionHeading eyebrow="The problem" title="Exact-match assertions don't survive non-determinism" className="mb-6" />
          <div className="flex flex-col gap-4 text-base leading-relaxed text-ink-muted">
            <p>
              The same prompt gives an agent different tool sequences, wording,
              and conclusions on every run. So the moment you write{" "}
              <span className="font-mono text-sm text-ink">assert result == &quot;expected&quot;</span>
              , you&apos;ve already lost — the test is flaky by construction.
            </p>
            <p>
              Real agents are reliable <em>statistically</em>: right 85% of the
              time, not always. agenteval tests for exactly that —{" "}
              <span className="text-ink font-medium">a pass rate over repeated
              runs</span> — which turns &ldquo;it felt worse this week&rdquo; into
              a number you can gate a CI pipeline on.
            </p>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="How it works" title="Trace, run N times, score, report" className="mb-6" />
          <PipelineDiagram
            stages={[
              {
                kicker: "instrument",
                title: "Tracer",
                detail:
                  "Wrap tools with tracer.wrap() / @tracer.tool — records name, args, result, timing, exceptions per call.",
              },
              {
                kicker: "repeat",
                title: "Runner",
                detail:
                  "Executes the test function N times concurrently, capturing an AgentTrace for each run.",
              },
              {
                kicker: "judge",
                title: "Assertions",
                detail:
                  "A fluent chain collects every failure before raising — behavioral checks on the trace, not the string.",
              },
              {
                kicker: "gate",
                title: "Reporter",
                detail:
                  "Terminal summary + JSON export; pass rate vs. threshold becomes a CI exit code.",
              },
            ]}
          />
        </section>

        {/* ── API ───────────────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="The API" title="A test is a behavior and a threshold" className="mb-6" />
          <div className="flex flex-col gap-4">
            <CopyCommand
              shell={false}
              label="a pass-rate test"
              lines={[
                "import agenteval",
                "from agenteval import Tracer",
                "",
                "@agenteval.test(n=20, threshold=0.85, tags=[\"search\"])",
                "async def test_agent(tracer: Tracer) -> None:",
                "    search = tracer.wrap(web_search)",
                '    async with tracer.run(input="query") as run:',
                '        result = await my_agent("query", search=search)',
                "        run.set_output(result)",
                "    tracer.assert_that().called_tool(\"web_search\").no_errors().check()",
              ]}
            />
            <CopyCommand
              shell={false}
              label="behavioral assertions are chainable + collected"
              lines={[
                "tracer.assert_that() \\",
                '    .called_tool("search") \\',
                '    .tool_call_count("search", min=1, max=3) \\',
                "    .completed_within_steps(8) \\",
                "    .completed_within_seconds(15.0) \\",
                "    .response_matches_schema(MyPydanticModel) \\",
                "    .no_errors() \\",
                "    .check()",
              ]}
            />
          </div>
          <div className="mt-4">
            <Callout label="collect-then-raise">
              The chain doesn&apos;t fail on the first error — it gathers all of
              them, so a single run tells you <span className="text-ink">every</span>{" "}
              expectation that broke, not just the first one.
            </Callout>
          </div>
        </section>

        {/* ── CLI ───────────────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="In CI" title="Run, gate, report" className="mb-6" />
          <CopyCommand
            label="cli"
            lines={[
              "agenteval run tests/ --n 10 --threshold 0.9 --traces --output report.json",
              "agenteval report report.json",
            ]}
          />
          <p className="text-sm text-ink-faint mt-3">
            Exit codes: 0 pass · 1 fail · 2 error — drop it straight into a CI step.
          </p>
        </section>

        {/* ── Engineering highlights ────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="What I built" title="Testing built for how agents actually behave" className="mb-6" />
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
              "pip install agenteval-py",
              'pip install "agenteval-py[all]"',
            ]}
          />
          <p className="text-sm text-ink-faint mt-3">
            Python 3.11+ · adapters for OpenAI, Anthropic, and LangChain.
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
