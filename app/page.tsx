import Nav from "@/components/nav";
import Hero from "@/components/hero";
import Projects from "@/components/projects";
import Experience from "@/components/experience";
import About from "@/components/about";
import LatestArtifacts from "@/components/artifacts/LatestArtifacts";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <Hero />
        <About />
        <Projects />
        <Experience />
        <LatestArtifacts />
      </main>
      <Footer />
    </div>
  );
}
