import { getPublicArtifacts } from "@/lib/artifacts";
import { getAllProjects } from "@/lib/projects";

export const revalidate = 60;

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
 * `/llms-full.txt` — the complete text of every artifact plus full project
 * metadata, in one request. This is the variant that actually removes work for
 * a model: no pagination, no excerpting, no HTML to strip.
 */
export async function GET() {
  const artifacts = await getPublicArtifacts();

  const out: string[] = [];

  out.push("# abhinandan", "", `> ${ABOUT}`, "");
  out.push(`Site: ${SITE}`);
  out.push(`Index (short): ${SITE}/llms.txt`);
  out.push("");

  out.push("# Projects", "");
  for (const project of getAllProjects()) {
    out.push(`## ${project.title}`, "");
    out.push(`- tag: ${project.tag}`);
    out.push(`- date: ${project.date}`);
    out.push(`- stack: ${project.stack.join(", ")}`);
    out.push(`- keywords: ${project.keywords.join(", ")}`);
    for (const link of project.links) {
      out.push(`- ${link.label}: ${link.url}`);
    }
    out.push(
      `- case study: ${project.hasPage ? `${SITE}/${project.slug}` : "none"}`,
    );
    out.push("", project.oneLiner, "");
  }

  out.push("# Artifacts", "");

  if (artifacts.length === 0) {
    out.push("No artifacts published yet.", "");
  }

  for (const artifact of artifacts) {
    const serial = String(artifact.serial_number).padStart(2, "0");
    out.push(`## ${serial} — ${artifact.artifact_name}`, "");
    out.push(`- canonical: ${SITE}/artifacts/${artifact.slug}`);
    out.push(`- published: ${artifact.published_at ?? "unpublished"}`);
    out.push(`- updated: ${artifact.updated_at}`);
    if (artifact.demo_youtube_url) {
      out.push(`- demo video: ${artifact.demo_youtube_url}`);
    }
    for (const link of artifact.github_links) {
      out.push(`- ${link.label}: ${link.url}`);
    }
    out.push("");
    out.push(artifact.story_markdown?.trim() || "(no body)");
    out.push("", "---", "");
  }

  out.push("# Contact", "");
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
