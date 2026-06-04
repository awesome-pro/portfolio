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
import ComparisonTable from "@/components/projects/ComparisonTable";
import ReplayTerminal, {
  type TraceStep,
} from "@/components/projects/ReplayTerminal";
import CopyCommand from "@/components/projects/CopyCommand";

export const revalidate = 86400; // static content — revalidate daily

const SLUG = "smartmemo";
const project = getProject(SLUG)!;
const url = `https://abhinandan.one/projects/${SLUG}`;

export const metadata: Metadata = {
  title: `${project.title} — A Semantic LLM Cache That Knows When Reuse Is Unsafe | Abhinandan`,
  description: project.oneLiner,
  keywords: project.keywords,
  openGraph: {
    title: `${project.title} — A Semantic LLM Cache That Knows When Reuse Is Unsafe`,
    description: project.oneLiner,
    url,
    type: "article",
    authors: ["Abhinandan"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${project.title} — A Semantic LLM Cache`,
    description: project.oneLiner,
  },
  alternates: { canonical: url },
};

/* ── Demo trace — the canonical false-positive the classifier prevents.
      Representative; swap with a real captured run anytime. ─────────────── */
const TRACE: TraceStep[] = [
  {
    role: "user",
    label: "PROMPT",
    text: 'cache.get_or_call("Approve the customer\'s refund request")',
  },
  {
    role: "tool",
    label: "FAISS",
    action: "search",
    text: "no candidate above threshold → MISS",
  },
  {
    role: "answer",
    label: "RESULT",
    text: "called LLM, stored response   (query_id = q1)",
  },
  {
    role: "user",
    label: "PROMPT",
    text: 'cache.get_or_call("Deny the customer\'s refund request")',
  },
  {
    role: "tool",
    label: "FAISS",
    action: "search",
    text: 'candidate q1 "Approve the…"   cosine = 0.913   ✓ above threshold',
  },
  {
    role: "verifier",
    label: "CLASSIFIER",
    action: "pairwise",
    text: "equivalence score = 0.04   →   NOT equivalent. Reject reuse.",
  },
  {
    role: "answer",
    label: "RESULT",
    text: `cache MISS → called LLM with the correct (deny) context.
A cosine-only cache (0.913 > threshold) would have returned
the *approve* answer. That's the false positive this prevents.`,
  },
];

const HIGHLIGHTS = [
  {
    title: "Classifier, not threshold",
    body: "Cosine similarity is a candidate selector, not a proof of equivalence. A small MLP over the embedding pair makes the final reuse decision — so near-duplicate-but-opposite prompts don't share a cached answer.",
  },
  {
    title: "Learns from its own mistakes",
    body: "Implicit feedback flags a re-issued prompt within a window as a likely bad hit; report_bad_hit() records explicit ones. export_feedback_pairs() turns them into JSONL retraining data.",
  },
  {
    title: "Gated retraining, not auto-reload",
    body: "smartmemo retrain runs behind validation gates — a new classifier only ships if it passes. No silent background swaps that could regress precision in production.",
  },
  {
    title: "WAL-backed SQLite",
    body: "Durable, thread-safe persistence with an async get_or_call API, bounded-backoff retries, and clean async-context resource teardown.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  name: project.title,
  description: project.oneLiner,
  codeRepository: "https://github.com/awesome-pro/smartmemo",
  programmingLanguage: project.programmingLanguage,
  keywords: project.keywords.join(", "),
  license: "https://opensource.org/licenses/MIT",
  runtimePlatform: "Python 3.11+",
  author: { "@type": "Person", name: "Abhinandan", url: "https://abhinandan.one" },
  mainEntityOfPage: { "@type": "WebPage", "@id": url },
};

export default function SmartMemoPage() {
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
              "FAISS retrieves candidates; a learned classifier decides reuse",
              "+30 precision points at equal recall vs. a tuned cosine baseline",
              "Bundled classifier — no training needed for a cold start",
              "Implicit + explicit bad-hit feedback feeds gated retraining",
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
          <SectionHeading eyebrow="The problem" title="Cosine similarity is not semantic equivalence" className="mb-6" />
          <div className="flex flex-col gap-4 text-base leading-relaxed text-ink-muted">
            <p>
              Semantic caches reuse an LLM response when a new prompt is
              &ldquo;close enough&rdquo; to an old one. But{" "}
              <span className="text-ink font-medium">close in embedding space
              isn&apos;t the same as equivalent in meaning</span>.
              &ldquo;Approve the refund&rdquo; and &ldquo;Deny the refund&rdquo;
              sit a hair apart by cosine — and a threshold-only cache will happily
              serve the wrong one.
            </p>
            <p>
              In a support, medical, or finance setting that&apos;s not a stale
              cache — it&apos;s a <span className="text-ink font-medium">wrong,
              confident answer</span>. SmartMemo keeps cosine as a fast{" "}
              <em>candidate selector</em> and adds a learned classifier as the{" "}
              <em>decision</em>.
            </p>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="How it works" title="Retrieve with cosine, decide with a classifier" className="mb-6" />
          <PipelineDiagram
            stages={[
              {
                kicker: "embed",
                title: "Encode",
                detail:
                  "Embed the prompt with all-MiniLM-L6-v2 (384-dim) — fast, local, no API call.",
              },
              {
                kicker: "retrieve",
                title: "FAISS search",
                detail:
                  "Find nearest cached prompts by cosine similarity — the candidate set, not the answer.",
              },
              {
                kicker: "decide",
                title: "Pairwise classifier",
                detail:
                  "A small MLP over the embedding pair scores true semantic equivalence. Below bar → cache miss.",
              },
              {
                kicker: "serve",
                title: "Reuse or call",
                detail:
                  "Equivalent → return the cached response. Otherwise call the LLM and store the new pair.",
              },
            ]}
          />
          <div className="mt-4">
            <Callout label="backbone">
              Embeddings: <span className="text-ink">all-MiniLM-L6-v2</span>{" "}
              (384-dim). The bundled classifier-v2 is a small MLP trained on{" "}
              <span className="text-ink">16,576 labeled pairs across 9 domains</span>{" "}
              — local-paraphraser positives and templated hard negatives.
            </Callout>
          </div>
        </section>

        {/* ── Demo ──────────────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="See it run" title="The false positive it refuses to make" className="mb-6" />
          <p className="text-base leading-relaxed text-ink-muted mb-6">
            Two prompts a hair apart in embedding space, opposite in meaning. The
            classifier catches what the cosine threshold can&apos;t.
          </p>
          <ReplayTerminal steps={TRACE} title="smartmemo · approve vs. deny" />
        </section>

        {/* ── Results ───────────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="The result" title="Classifier-v2 vs. a tuned cosine baseline" className="mb-6" />
          <ComparisonTable
            columns={[
              { label: "Tuned cosine" },
              { label: "Classifier-v2", highlight: true },
            ]}
            rows={[
              { metric: "Precision", values: ["0.53", "0.83"], betterIndex: 1, note: "at equal recall" },
              { metric: "Recall", values: ["0.94", "0.94"] },
              { metric: "F1", values: ["0.67", "0.88"], betterIndex: 1 },
              { metric: "False positives", values: ["26", "6"], betterIndex: 1, note: "on the 84-pair gold set" },
            ]}
            caption="Gold test set: 84 held-out pairs (31 equivalent, 53 not). +30 precision points with recall held constant — the cache rejects 20 more wrong reuses without losing a single correct hit."
          />
          <p className="text-sm text-ink-faint mt-4 leading-relaxed">
            On a deliberately adversarial high-stakes set (16 medical/legal/finance
            opposite-action pairs), false-positive hits dropped from 8 → 6. A
            generic classifier isn&apos;t infallible out of distribution — which is
            exactly why the feedback-and-retraining loop exists.
          </p>
        </section>

        {/* ── API ───────────────────────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="The API" title="One call, cache-aware" className="mb-6" />
          <CopyCommand
            shell={false}
            label="get-or-call with the bundled classifier"
            lines={[
              "from smartmemo import SmartMemo, ClassifierConfig",
              "",
              "cache = SmartMemo(",
              '    domain="customer-support",',
              "    classifier=ClassifierConfig.bundled(),",
              ")",
              "",
              "result = await cache.get_or_call(",
              '    prompt="Summarize this customer\'s latest billing ticket",',
              "    llm_function=call_llm,",
              ")",
              "result.response, result.was_cache_hit, result.classifier_score",
            ]}
          />
          <div className="mt-4">
            <Callout label="closing the loop">
              <span className="text-ink">report_bad_hit(query_id, reason=…)</span>{" "}
              and implicit re-issue detection record misses;{" "}
              <span className="text-ink">export_feedback_pairs(path)</span> turns
              them into JSONL, and <span className="text-ink">smartmemo retrain</span>{" "}
              ships a new classifier only if it clears the validation gates.
            </Callout>
          </div>
        </section>

        {/* ── Engineering highlights ────────────────────────────────────── */}
        <section className="mb-16">
          <SectionHeading eyebrow="What I built" title="Why it holds up in production" className="mb-6" />
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
          <CopyCommand label="pip" lines={['pip install "smartmemo[ml]"']} />
          <p className="text-sm text-ink-faint mt-3">
            Ships a pretrained classifier — no training required for a cold start.
            CI across Python 3.11–3.14.
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
