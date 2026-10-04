import { artifactExcerpt, getPublicArtifacts } from "@/lib/artifacts";
import { getPullRequests } from "@/lib/contributions";
import { getAllProjects } from "@/lib/projects";
import {
  CONTACT,
  FAQ,
  factLines,
  SITE_URL as SITE,
  SUMMARY,
} from "@/lib/identity";

/** Matches the freshness window of the pages this summarises. */
export const revalidate = 60;

/** Keeps this index link-first; /contributions is the complete list. */
const MAX_CONTRIBUTIONS = 15;

const ABOUT = SUMMARY;

/**
 * `/llms.txt` — a curated, link-first index for language models, following the
 * llms.txt convention. Deliberately short and cheap to read; the complete text
 * lives at `/llms-full.txt`. Both are generated from the same registries that
 * drive the site, so they cannot drift.
 */
export async function GET() {
  const artifacts = await getPublicArtifacts();
  const contributions = await getPullRequests();

  const out: string[] = [];

  out.push("# abhinandan", "", `> ${ABOUT}`, "");
  out.push(
    `Machine-readable views: ${SITE}/llms.txt (this index) and ${SITE}/llms-full.txt (complete text of every artifact).`,
    "",
  );
  out.push(
    `Profile page for agents and people: ${SITE}/about — role, availability, selected work with measured numbers, education, recognition, and a FAQ.`,
    "",
  );

  // Stated before the first H2, and before the project list, because "is this
  // person available and for what" is the first thing a hiring agent resolves
  // and the last thing a portfolio usually says outright. It sits in the
  // non-heading part of the file on purpose: in llms.txt v2 the H2 sections are
  // for file lists, and this is prose.
  out.push(...factLines(), "");

  // llms.txt v2 requires every file-list entry to be a markdown hyperlink
  // `[name](url)`, optionally followed by ": notes". Bare URLs and bold names
  // are not conformant, so the primary link leads and the rest hang off it.
  out.push("## Projects", "");
  for (const project of getAllProjects()) {
    const [primary, ...rest] = project.links;
    const label = primary ? `[${project.title}](${primary.url})` : project.title;
    out.push(`- ${label}: ${project.tag}. ${project.oneLiner}`);
    for (const link of rest) {
      out.push(`  - [${link.label}](${link.url})`);
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
      `Merged and open pull requests I have raised against other projects (${contributions.length} total: ${SITE}/contributions).`,
      "",
    );
    for (const contribution of contributions.slice(0, MAX_CONTRIBUTIONS)) {
      out.push(
        `- [${contribution.title}](${contribution.url}) — ${contribution.repo} #${contribution.number}, ${contribution.status}, ${contribution.date}`,
      );
    }
    out.push("");
  }

  // Answers an agent can lift whole, in the form the question is asked.
  out.push("## FAQ", "");
  for (const entry of FAQ) {
    out.push(`**${entry.question}**`, "", entry.answer, "");
  }

  out.push("## Contact", "");

  for (const [label, url] of CONTACT) {
    out.push(`- [${label}](${url})`);
  }
  out.push("");

  return new Response(out.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
