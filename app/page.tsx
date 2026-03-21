import Nav from "@/components/nav";
import Hero from "@/components/hero";
import Skills from "@/components/skills";
import Projects from "@/components/projects";
import About from "@/components/about";
import Proof from "@/components/proof";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <Hero />
        <Skills />
        <Projects />
        <About />
        <Proof />
      </main>
      <Footer />
    </div>
  );
}
