import type { Metadata } from "next";
import Nav from "@/components/nav";
import Footer from "@/components/footer";
import ArtifactIndex from "@/components/artifacts/ArtifactIndex";
import { getPublicArtifacts, type Artifact } from "@/lib/artifacts";
import {
  artifactKeywords,
  buildArtifactItemList,
} from "@/lib/artifact-seo";
import { PERSON_ID, SITE_NAME, SITE_URL, WEBSITE_ID } from "@/lib/identity";

const url = `${SITE_URL}/artifacts`;

const DESCRIPTION =
  "Training runs, eval write-ups, failure cases, and the numbers that came out. Notes from the inference and RL work I've done.";

export const revalidate = 30;

/**
 * Keywords for the index are the union of what the artifacts themselves use —
 * the same derivation the artifact pages run, so the listing can only claim
 * terms that appear in the work it lists.
 */
function indexKeywords(artifacts: Artifact[]): string[] {
  const seen: string[] = [];
  for (const artifact of artifacts) {
    for (const keyword of artifactKeywords(artifact.story_markdown)) {
      if (!seen.includes(keyword)) seen.push(keyword);
      if (seen.length >= 15) return seen;
    }
  }
  return seen;
}

export async function generateMetadata(): Promise<Metadata> {
  const artifacts = await getPublicArtifacts();

  return {
    title: "Artifacts | Abhinandan",
    description: DESCRIPTION,
    keywords: indexKeywords(artifacts),
    authors: [{ name: "Abhinandan", url: SITE_URL }],
    alternates: { canonical: url },
    openGraph: {
      title: "Artifacts",
      description:
        "Training runs, eval write-ups, failure cases, and the numbers that came out.",
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Artifacts",
      description:
        "Training runs, eval write-ups, failure cases, and the numbers that came out.",
    },
  };
}

export default async function ArtifactsPage() {
  const artifacts = await getPublicArtifacts();

  // An ItemList is what a listing page is, and an answer engine reading only
  // this page gets every artifact with its own summary and dates. Each entry's
  // `@id` is the one its page declares, so the two documents merge into one
  // graph instead of describing the same work twice.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#collection`,
        url,
        name: "Artifacts",
        description: DESCRIPTION,
        inLanguage: "en-US",
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": PERSON_ID },
        mainEntity: { "@id": `${url}#list` },
        breadcrumb: { "@id": `${url}#breadcrumbs` },
      },
      // Every artifact with its own summary, dates and reading time, so an
      // answer engine that reads only this page still learns what the work is.
      buildArtifactItemList(artifacts, `${url}#list`, "Artifacts"),
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumbs`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Artifacts", item: url },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Nav />

      <main className="mx-auto w-full max-w-3xl px-6 py-14">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Artifacts
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">
            What I build, what I think, What I learn - I generally write here
          </p>

          <div className="mt-10">
            {/* h2 here: on the homepage this list sits under an "Artifacts" h2,
                but on its own page the h1 is the section and the items are the
                next level down. */}
            <ArtifactIndex artifacts={artifacts} headingLevel={2} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
