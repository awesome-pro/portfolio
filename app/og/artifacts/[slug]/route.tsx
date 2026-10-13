// The social/search card for an artifact that has no architecture media.
//
// A route handler rather than the `opengraph-image` file convention, because
// this card is the *fallback*: the page prefers a real screenshot when the
// artifact has one, and a file-convention image would be injected whether the
// page wanted it or not. `lib/artifact-seo.ts` decides which URL wins.
//
// It lives outside /api deliberately — robots.txt disallows /api/, and an image
// a crawler is told not to fetch is not much of a card.

import { ImageResponse } from "next/og";
import {
  getAllArtifactSlugsStatic,
  getArtifactBySlugStatic,
} from "@/lib/artifacts";
import {
  artifactDescription,
  artifactSerial,
  artifactStats,
} from "@/lib/artifact-seo";
import { SITE_URL } from "@/lib/identity";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Cards change only when the artifact does. */
export const revalidate = 3600;

/** Built once per artifact; unknown slugs are still handled at request time. */
export async function generateStaticParams() {
  const slugs = await getAllArtifactSlugsStatic();
  return slugs.map((slug) => ({ slug }));
}

/** Long artifact names shrink rather than overflow the card. */
function titleSize(title: string): number {
  if (title.length > 64) return 44;
  if (title.length > 40) return 56;
  return 68;
}

function clamp(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const artifact = await getArtifactBySlugStatic(slug);
  if (!artifact) return new Response("Not found", { status: 404 });

  const stats = artifactStats(artifact.story_markdown);
  const excerpt = clamp(artifactDescription(artifact, 200), 200);
  const published = artifact.published_at?.slice(0, 10) ?? "unpublished";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          backgroundColor: "#0a0a0a",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "18px",
            fontFamily: "monospace",
            color: "#888",
            textTransform: "uppercase",
            letterSpacing: "3px",
          }}
        >
          {`artifact ${artifactSerial(artifact)} · ${published}`}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div
            style={{
              fontSize: `${titleSize(artifact.artifact_name)}px`,
              fontWeight: "bold",
              color: "#f5f5f5",
              lineHeight: 1.05,
              maxWidth: "1000px",
            }}
          >
            {artifact.artifact_name}
          </div>
          <div
            style={{
              fontSize: "25px",
              color: "#9a9a9a",
              lineHeight: 1.4,
              maxWidth: "960px",
            }}
          >
            {excerpt}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{ fontSize: "20px", fontFamily: "monospace", color: "#777" }}
          >
            {stats.minutes > 0
              ? `${stats.minutes} min read · ${stats.words.toLocaleString("en-US")} words`
              : ""}
          </span>
          <span
            style={{ fontSize: "18px", fontFamily: "monospace", color: "#555" }}
          >
            {`${SITE_URL.replace(/^https?:\/\//, "")}/artifacts/${artifact.slug}`}
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        // The card is a pure function of the artifact's own fields.
        "cache-control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
