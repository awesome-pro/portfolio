import Link from "next/link";
import Nav from "@/components/nav";
import Hero from "@/components/hero";
import Projects from "@/components/projects";
import Experience from "@/components/experience";
import ArtifactIndex from "@/components/artifacts/ArtifactIndex";
import Footer from "@/components/footer";
import { getPublicArtifacts } from "@/lib/artifacts";

export const revalidate = 30;

/** How many artifacts the homepage shows before linking out to the full index. */
const INITIAL_ARTIFACTS = 3;

export default async function Home() {
  const artifacts = await getPublicArtifacts();
  // getPublicArtifacts() is newest-first, so the head is the latest work.
  const latestArtifacts = artifacts.slice(0, INITIAL_ARTIFACTS);
  const hasMoreArtifacts = artifacts.length > latestArtifacts.length;

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

        <Projects />
        <Experience />
      </main>
      <Footer />
    </div>
  );
}
