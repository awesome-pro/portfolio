import Nav from "@/components/nav";
import Hero from "@/components/hero";
import Skills from "@/components/skills";
import Projects from "@/components/projects";
import Experience from "@/components/experience";
import About from "@/components/about";
import Proof from "@/components/proof";
import LatestBlogs from "@/components/blogs/LatestBlogs";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
        <Hero />
        <Projects />
        <Experience />
        <Skills />
        <About />
        <Proof />
        <LatestBlogs />
      </main>
      <Footer />
    </div>
  );
}
