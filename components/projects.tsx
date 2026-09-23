import Link from "next/link";
import { getAllProjects, type ProjectMeta } from "@/lib/projects";
import Expandable from "@/components/projects/Expandable";

/** How many projects the homepage shows before the toggle. */
const INITIAL_COUNT = 3;

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
  const visible = projects.slice(0, INITIAL_COUNT);
  const hidden = projects.slice(INITIAL_COUNT);

  return (
    <section className="mx-auto w-full max-w-3xl border-t border-border px-6 py-14">
      <div>
       <h2 className="font-mono text-xs tracking-[0.25em] text-ink-faint uppercase">
          Projects
       </h2>
        <div className="mt-6 flex flex-col">
          {visible.map((project, index) => (
            <ProjectRow key={project.slug} project={project} index={index} />
          ))}

          {hidden.length > 0 && (
            <Expandable count={hidden.length} noun="projects">
              {hidden.map((project, index) => (
                <ProjectRow
                  key={project.slug}
                  project={project}
                  index={index + INITIAL_COUNT}
                />
              ))}
            </Expandable>
          )}
        </div>
      </div>
    </section>
  );
}
