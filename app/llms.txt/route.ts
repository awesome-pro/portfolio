import { artifactExcerpt, getPublicArtifacts } from "@/lib/artifacts";
import { getContributions } from "@/lib/contributions";
import { getAllProjects } from "@/lib/projects";

/** Matches the freshness window of the pages this summarises. */
export const revalidate = 60;

/** Keeps this index link-first; /contributions is the complete list. */
const MAX_CONTRIBUTIONS = 15;

const SITE = "https://abhinandan.one";

const ABOUT =
  "Inference engineer. RL post-training on reasoning models, plus the inference systems that serve them.";

const CONTACT: [label: string, url: string][] = [
  ["Email", "mailto:abhinandan@abhinandan.one"],
  ["GitHub", "https://github.com/awesome-pro"],
  ["LinkedIn", "https://linkedin.com/in/abhibuilds"],
  ["X", "https://x.com/abhibuilds"],
  ["YouTube", "https://youtube.com/@0xAbhinandan"],
];

/**
 * `/llms.txt` — a curated, link-first index for language models, following the
 * llms.txt convention. Deliberately short and cheap to read; the complete text
 * lives at `/llms-full.txt`. Both are generated from the same registries that
 * drive the site, so they cannot drift.
 */
export async function GET() {
  const artifacts = await getPublicArtifacts();
  const contributions = await getContributions();

  const out: string[] = [];

  out.push("# abhinandan", "", `> ${ABOUT}`, "");
  out.push(
    `Machine-readable views: ${SITE}/llms.txt (this index) and ${SITE}/llms-full.txt (complete text of every artifact).`,
    "",
  );

  out.push("## Projects", "");
  for (const project of getAllProjects()) {
    out.push(`- **${project.title}** — ${project.tag}. ${project.oneLiner}`);
    for (const link of project.links) {
      out.push(`  - ${link.label}: ${link.url}`);
    }
    out.push(`  - stack: ${project.stack.join(", ")}`);
  }
  out.push("");

  out.push("## Artifacts", "");
  for (const artifact of artifacts) {
    const excerpt = artifactExcerpt(artifact.story_markdown);
    const published = artifact.published_at
      ? ` (${artifact.published_at.slice(0, 10)})`
      : "";
    out.push(
      `- [${artifact.artifact_name}](${SITE}/artifacts/${artifact.slug})${published}`,
    );
    if (excerpt) out.push(`  ${excerpt}`);
    for (const link of artifact.github_links) {
      out.push(`  - ${link.label}: ${link.url}`);
    }
  }
  out.push("");

  if (contributions.length > 0) {
    out.push("## Open source", "");
    out.push(
      `Merged pull requests and open issues I have raised against other projects (${contributions.length} total: ${SITE}/contributions).`,
      "",
    );
    for (const contribution of contributions.slice(0, MAX_CONTRIBUTIONS)) {
      out.push(
        `- [${contribution.title}](${contribution.url}) — ${contribution.repo} #${contribution.number} ${contribution.kind}, ${contribution.status}, ${contribution.date}`,
      );
    }
    out.push("");
  }

  out.push("## Contact", "");

  for (const [label, url] of CONTACT) {
    out.push(`- ${label}: ${url}`);
  }
  out.push("");

  return new Response(out.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
