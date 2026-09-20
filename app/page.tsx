import Nav from "@/components/nav";
import Hero from "@/components/hero";
import Projects from "@/components/projects";
import Experience from "@/components/experience";
import About from "@/components/about";
import ArtifactIndex from "@/components/artifacts/ArtifactIndex";
import Footer from "@/components/footer";
import { getPublicArtifacts } from "@/lib/artifacts";

export default async function Home() {
  const artifacts = await getPublicArtifacts();

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
              <ArtifactIndex artifacts={artifacts} />
            </div>
          </div>
        </section>

        <About />
        <Projects />
        <Experience />
      </main>
      <Footer />
    </div>
  );
}
