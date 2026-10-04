import Link from "next/link";
import Nav from "@/components/nav";
import Hero from "@/components/hero";
import Projects from "@/components/projects";
import Experience from "@/components/experience";
import ArtifactIndex from "@/components/artifacts/ArtifactIndex";
import ContributionList from "@/components/contributions";
import Footer from "@/components/footer";
import { getPublicArtifacts } from "@/lib/artifacts";
import { getPullRequests } from "@/lib/contributions";

export const revalidate = 30;

/** How many artifacts the homepage shows before linking out to the full index. */
const INITIAL_ARTIFACTS = 3;

/** How many merged pull requests the homepage shows before linking out. */
const INITIAL_CONTRIBUTIONS = 3;

export default async function Home() {
  const artifacts = await getPublicArtifacts();
  // getPublicArtifacts() is newest-first, so the head is the latest work.
  const latestArtifacts = artifacts.slice(0, INITIAL_ARTIFACTS);
  const hasMoreArtifacts = artifacts.length > latestArtifacts.length;

  // Merged pull requests only. This section is the proof-of-work slot: code
  // that landed, not code that is waiting. An open PR is a claim rather than a
  // result, so it does not take a slot here either.
  const mergedPullRequests = (await getPullRequests()).filter(
    (contribution) => contribution.status === "merged"
  );
  const latestContributions = mergedPullRequests.slice(
    0,
    INITIAL_CONTRIBUTIONS
  );
  const hasMoreContributions =
    mergedPullRequests.length > latestContributions.length;

  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <Hero />

        <section className="mx-auto w-full max-w-3xl border-t border-border px-6 py-14">
          <div>
            <h2 className="font-mono text-xs tracking-[0.25em] text-ink-faint uppercase">
              Artifacts
            </h2>
            <div className="mt-6">
              <ArtifactIndex artifacts={latestArtifacts} />
            </div>
            {hasMoreArtifacts && (
              <div className="mt-10">
                <Link
                  href="/artifacts"
                  className="font-mono text-xs text-ink transition-colors hover:text-ink"
                >
                  all artifacts →
                </Link>
              </div>
            )}
          </div>
        </section>

        {latestContributions.length > 0 && (
          <section className="mx-auto w-full max-w-3xl border-t border-border px-6 py-14">
            <div>
              <h2 className="font-mono text-xs tracking-[0.25em] text-ink-faint uppercase">
                Open source
              </h2>
              <div className="mt-6">
                <ContributionList contributions={latestContributions} />
              </div>
              {hasMoreContributions && (
                <div className="mt-10">
                  <Link
                    href="/contributions"
                    className="font-mono text-xs text-ink transition-colors hover:text-ink"
                  >
                    all contributions →
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        <Projects />
        <Experience />
      </main>
      <Footer />
    </div>
  );
}
