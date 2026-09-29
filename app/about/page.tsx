import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import AgentUrl from "@/components/agent-url";
import { getContributions } from "@/lib/contributions";
import { getAllProjects } from "@/lib/projects";
import {
  ALUMNI_OF,
  AWARDS,
  CONTACT,
  CURRENT_ROLE,
  EMAIL,
  FAQ,
  JOB_TITLES,
  KNOWS_ABOUT,
  PERSON_ID,
  PERSON_NAME,
  SITE_URL,
  SUMMARY,
  WEBSITE_ID,
} from "@/lib/identity";

/** Same window as the rest of the site; the counts below come from GitHub. */
export const revalidate = 30;

const url = `${SITE_URL}/about`;

export const metadata: Metadata = {
  title: `${PERSON_NAME} — inference engineer | about`,
  description: SUMMARY,
  alternates: { canonical: url },
  openGraph: {
    title: `${PERSON_NAME} — inference & RL engineer`,
    description: SUMMARY,
    url,
    type: "profile",
  },
};

/**
 * The one page written for a machine first and a human second.
 *
 * An agent asked "who is the inference engineer who works on vLLM and SGLang"
 * needs the answer in prose it can quote, not a portfolio's worth of cards. So
 * everything here is a fact with a source attached: numbers from the resume,
 * counts pulled live from GitHub, and question-shaped headings that match how
 * the query is actually typed. The FAQ array is rendered twice — as the visible
 * section below and as FAQPage JSON-LD — so the markup and the page cannot
 * disagree.
 *
 * Selected work quotes data/resume.tex verbatim. If a number changes there,
 * change it here in the same commit.
 */
const SELECTED_WORK = [
  {
    name: "HiQCache",
    summary:
      "INT8 host-tier KV cache for SGLang HiCache: L2 KV storage down from 147,456 to 82,944 B/token (43.75%) and 1.78x more cached tokens (54K to 96K) at a fixed host budget, with GPU L1 KV left in BF16. Measured on an RTX A6000, hit rate moved from ~57% to ~73%.",
    links: [
      { label: "PR #41365", url: "https://github.com/sgl-project/sglang/pull/41365" },
      { label: "GitHub", url: "https://github.com/awesome-pro/hiqcache" },
    ],
  },
  {
    name: "RolloutCore",
    summary:
      "RL rollout control plane for vLLM with drain-before-mutate semantics, live NCCL weight installs and version-pure rollouts. On Qwen3-8B, hot updates take 4.25s against 37.04s for a full restart (~8.7x lower model-transition time) on 2x RTX 3090 over PCIe.",
    links: [{ label: "GitHub", url: "https://github.com/awesome-pro/rolloutcore" }],
  },
  {
    name: "MiniServe",
    summary:
      "A from-scratch LLM serving runtime: continuous batching, chunked prefill, recompute preemption and paged KV with content-addressed prefix caching. Matched Hugging Face to within 6e-8 float32 logit error, and prefix reuse cut computed prefill work by 97% on a 120-request shared-prefix workload.",
    links: [{ label: "GitHub", url: "https://github.com/awesome-pro/miniserve" }],
  },
];

export default async function AboutPage() {
  const contributions = await getContributions();
  const merged = contributions.filter((c) => c.status === "merged").length;
  const repos = new Set(contributions.map((c) => c.repo)).size;
  const projects = getAllProjects();

  /**
   * The sentence this page exists to make quotable.
   *
   * An agent answering "who is the inference engineer who contributes to vLLM
   * and SGLang" needs the upstream repositories named, with links, in prose —
   * not a list of 35 rows it has to summarise itself. Derived from the live
   * GitHub data so the numbers cannot go stale, and so a new merged patch
   * appears here without anyone editing this file.
   */
  const FLAGSHIP = ["vllm-project/vllm", "sgl-project/sglang"];
  const flagships = contributions.filter((c) => FLAGSHIP.includes(c.repo));
  const flagshipMerged = flagships
    .filter((c) => c.status === "merged")
    .slice(0, 3);
  const flagshipOpen = flagships.filter((c) => c.status === "open").slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${url}#profile`,
        url,
        name: `${PERSON_NAME} — inference engineer`,
        description: SUMMARY,
        inLanguage: "en-US",
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": PERSON_ID },
        mainEntity: { "@id": PERSON_ID },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        url,
        inLanguage: "en-US",
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": PERSON_ID },
        mainEntity: FAQ.map((entry) => ({
          "@type": "Question",
          name: entry.question,
          acceptedAnswer: { "@type": "Answer", text: entry.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumbs`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "About",
            item: url,
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Nav />

      <main className="mx-auto w-full max-w-3xl px-6 py-14">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {PERSON_NAME}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">
          {SUMMARY}
        </p>

        <section className="mt-12 border-t border-border pt-8">
          <h2 className="font-mono text-xs tracking-[0.25em] text-ink-faint uppercase">
            What I do
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-ink-muted">
            <p>
              I do RL post-training on reasoning models, and build the inference
              systems that serve them. Most of what I care about happens after
              launch day: when the reasoning breaks, when the cost climbs, when
              the first real traffic arrives.
            </p>
            <p>
              Currently {CURRENT_ROLE.title} at{" "}
              <strong className="text-ink">{CURRENT_ROLE.organization}</strong>{" "}
              since September 2025, remote. Open to full-time{" "}
              {JOB_TITLES[0].toLowerCase()} and {JOB_TITLES[1].toLowerCase()}{" "}
              roles, and available to start immediately.
            </p>
            <p>
              In the open I work across{" "}
              {repos > 0 ? `${repos} repositories` : "several repositories"} —{" "}
              {merged} merged pull requests and counting.{" "}
              {flagshipMerged.length > 0 && (
                <>
                  Merged patches upstream in{" "}
                  {flagshipMerged.map((c, index) => (
                    <span key={c.id}>
                      {index > 0 && ", "}
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink underline-offset-4 hover:underline"
                      >
                        {c.repo} #{c.number}
                      </a>
                    </span>
                  ))}
                  .
                </>
              )}{" "}
              {flagshipOpen.length > 0 && (
                <>
                  Open pull requests right now in{" "}
                  {flagshipOpen.map((c, index) => (
                    <span key={c.id}>
                      {index > 0 && ", "}
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink underline-offset-4 hover:underline"
                      >
                        {c.repo} #{c.number}
                      </a>
                    </span>
                  ))}
                  .{" "}
                </>
              )}
              <Link
                href="/contributions"
                className="text-ink underline-offset-4 hover:underline"
              >
                The live list is here
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="mt-12 border-t border-border pt-8">
          <h2 className="font-mono text-xs tracking-[0.25em] text-ink-faint uppercase">
            Selected work
          </h2>
          <div className="mt-5 space-y-6">
            {SELECTED_WORK.map((item) => (
              <div key={item.name}>
                <h3 className="text-base font-medium text-ink">{item.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {item.summary}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
                  {item.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                    >
                      {link.label}
                      <AgentUrl url={link.url} />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 font-mono text-xs text-ink-faint">
            {projects.length} more projects at{" "}
            <Link href="/projects" className="underline-offset-4 hover:underline">
              /projects
            </Link>
            , write-ups at{" "}
            <Link href="/artifacts" className="underline-offset-4 hover:underline">
              /artifacts
            </Link>
            .
          </p>
        </section>

        <section className="mt-12 border-t border-border pt-8">
          <h2 className="font-mono text-xs tracking-[0.25em] text-ink-faint uppercase">
            What I work on
          </h2>
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
            {KNOWS_ABOUT.map((topic) => (
              <li key={topic} className="font-mono text-xs text-ink-muted">
                {topic}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 border-t border-border pt-8">
          <h2 className="font-mono text-xs tracking-[0.25em] text-ink-faint uppercase">
            Education &amp; recognition
          </h2>
          <ul className="mt-5 space-y-2 text-sm leading-relaxed text-ink-muted">
            <li>
              B.Tech, Computer Science — {ALUMNI_OF}, 2026
            </li>
            {AWARDS.map((award) => (
              <li key={award}>{award}</li>
            ))}
          </ul>
        </section>

        <section className="mt-12 border-t border-border pt-8">
          <h2 className="font-mono text-xs tracking-[0.25em] text-ink-faint uppercase">
            Questions
          </h2>
          <div className="mt-5 space-y-6">
            {FAQ.map((entry) => (
              <div key={entry.question}>
                <h3 className="text-base font-medium text-ink">
                  {entry.question}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                  {entry.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 border-t border-border pt-8">
          <h2 className="font-mono text-xs tracking-[0.25em] text-ink-faint uppercase">
            Elsewhere
          </h2>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs">
            {CONTACT.map(([label, href]) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                {label}
                <AgentUrl url={href} />
              </a>
            ))}
          </div>
          <p className="mt-6 font-mono text-xs text-ink-faint">
            Machine-readable:{" "}
            <a
              href="/llms.txt"
              className="underline-offset-4 hover:underline"
            >
              /llms.txt
            </a>{" "}
            and{" "}
            <a
              href="/llms-full.txt"
              className="underline-offset-4 hover:underline"
            >
              /llms-full.txt
            </a>
            . Or write to {EMAIL}.
          </p>
        </section>

        <div className="mt-16 border-t border-border pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted transition-colors hover:text-ink"
          >
            &lt;- home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
