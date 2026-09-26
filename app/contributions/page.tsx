import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import ContributionList from "@/components/contributions";
import { getContributions } from "@/lib/contributions";

/**
 * Pull requests land on the order of days, and lib/contributions.ts caches the
 * GitHub response for the same window, so this is cheap.
 */
export const revalidate = 900;

const url = "https://abhinandan.one/contributions";

export const metadata: Metadata = {
  title: "Open source | Abhinandan",
  description:
    "Merged pull requests and open issues I've raised against other people's open-source projects.",
  openGraph: {
    title: "Open source contributions",
    description:
      "Merged pull requests and open issues I've raised against other people's open-source projects.",
    url,
    type: "website",
  },
  alternates: { canonical: url },
};

export default async function ContributionsPage() {
  const contributions = await getContributions();
  const merged = contributions.filter((c) => c.status === "merged").length;
  const open = contributions.filter((c) => c.status === "open").length;
  const repos = new Set(contributions.map((c) => c.repo)).size;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Open source contributions",
    url,
    hasPart: contributions.map((contribution) => ({
      "@type": "SoftwareSourceCode",
      name: contribution.title,
      codeRepository: `https://github.com/${contribution.repo}`,
      url: contribution.url,
    })),
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
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Open source
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">
            Pull requests and issues I&apos;ve opened against other
            people&apos;s projects, read straight from GitHub. Merged and still
            open only.
          </p>

          {contributions.length > 0 && (
            <p className="mt-5 font-mono text-xs text-ink-faint">
              {merged} merged &middot; {open} open &middot; {contributions.length}{" "}
              total across {repos} repositories
            </p>
          )}

          <div className="mt-10">
            {contributions.length > 0 ? (
              <ContributionList contributions={contributions} />
            ) : (
              <p className="py-10 font-mono text-sm text-ink-faint">
                GitHub isn&apos;t reachable right now. Try again shortly.
              </p>
            )}
          </div>

          <div className="mt-16 border-t border-border pt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted transition-colors hover:text-ink"
            >
              &lt;- home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
