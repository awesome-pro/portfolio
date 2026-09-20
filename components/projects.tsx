import Link from "next/link";
import { getAllProjects, type ProjectMeta } from "@/lib/projects";

function ProjectRow({ project, index }: { project: ProjectMeta; index: number }) {
  const github = project.links.find((link) => link.label === "GitHub")?.url;
  const href = project.hasPage ? `/${project.slug}` : github;

  const body = (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <span className="text-base font-medium text-ink">{project.title}</span>
          <span className="font-mono text-xs text-ink-faint">{project.tag}</span>
        </div>
        {project.headlineStat && (
          <span className="font-mono text-xs text-ink-muted">
            {project.headlineStat.value}
          </span>
        )}
      </div>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
        {project.oneLiner}
      </p>
    </>
  );

  const className = `group block py-5 ${index !== 0 ? "border-t border-border" : ""}`;

  if (!href) {
    return <div className={className}>{body}</div>;
  }

  return project.hasPage ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {body}
    </a>
  );
}

export default function Projects() {
  const projects = getAllProjects();

  return (
    <section className="mx-auto w-full max-w-3xl border-t border-border px-6 py-14">
      <div>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-mono text-xs tracking-[0.25em] text-ink-faint uppercase">
            Projects
          </h2>
          <Link
            href="/projects"
            className="font-mono text-xs text-ink-faint transition-colors hover:text-ink"
          >
            all projects →
          </Link>
        </div>

        <div className="mt-6 flex flex-col">
          {projects.map((project, index) => (
            <ProjectRow key={project.slug} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
