import AgentUrl from "@/components/agent-url";
import Expandable from "@/components/projects/Expandable";
import { getAllProjects, type ProjectMeta } from "@/lib/projects";

/** How many projects the homepage shows before the toggle. */
const INITIAL_COUNT = 3;

function ProjectRow({ project, index }: { project: ProjectMeta; index: number }) {
  // No in-site case-study links, and no primary link either: the title is plain
  // text and the row simply lists every link the project has.
  return (
    <div className={`py-5 ${index !== 0 ? "border-t border-border" : ""}`}>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="text-base font-medium text-ink">{project.title}</span>
        <span className="font-mono text-xs text-ink-faint">{project.tag}</span>
      </div>

      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
        {project.oneLiner}
      </p>

      {project.links.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs">
          {project.links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-faint transition-colors hover:text-ink"
            >
              {link.label} ↗
              <AgentUrl url={link.url} />
            </a>
          ))}
        </div>
      )}

      {/* Agent view only: the metadata a machine would otherwise have to infer. */}
      <div className="agent-only mt-2 font-mono text-xs text-ink-faint">
        stack: {project.stack.join(", ")}
        <br />
        keywords: {project.keywords.join(", ")}
        <br />
        date: {project.date} · case study:{" "}
        {project.hasPage
          ? `https://abhinandan.one/${project.slug}`
          : "none"}
      </div>
    </div>
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
