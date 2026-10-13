// Everything an artifact page tells a machine about itself.
//
// Server-only: it reads `lib/artifacts` for values, and that module holds the
// service-role Supabase client. Nothing here may be imported by a client
// component.
//
// The point of centralising this is agreement. The meta description, the
// structured data, the social card, the sitemap and llms.txt are all generated
// from the same strings, so a crawler that reads two of them cannot find two
// different answers — the same rule `lib/identity.ts` enforces for the person.

import type { Metadata } from "next";
import readingTime from "reading-time";
import {
  artifactExcerpt,
  extractYouTubeId,
  youtubeEmbedUrl,
  type Artifact,
} from "@/lib/artifacts";
import { isVideoUrl } from "@/lib/artifact-media";
import { extractHeadings } from "@/lib/heading-anchors";
import {
  KNOWS_ABOUT,
  PERSON_ID,
  PERSON_NAME,
  SITE_NAME,
  SITE_URL,
  WEBSITE_ID,
} from "@/lib/identity";
import { getAllProjects } from "@/lib/projects";

/** Used only when a story has no prose to quote — never as filler prose. */
const DEFAULT_DESCRIPTION =
  "A build artifact. What I built, how I tested it, and where it broke.";

/** The section of the publication this work belongs to, for `articleSection`. */
const ARTICLE_SECTION = "Artifacts";

/** Hosts where a link means "the code lives here". */
const CODE_HOST =
  /^https?:\/\/(?:www\.)?(?:github\.com|gitlab\.com|codeberg\.org|bitbucket\.org)\//;

/** A repository itself, not a pull request, issue, or file inside one. */
const REPO_ROOT = /^https?:\/\/github\.com\/[^/?#]+\/[^/?#]+\/?$/;

/**
 * `github.com/owner/repo/pull/7` → `github.com/owner/repo`. A write-up usually
 * links the pull request that landed the work before it links the repository.
 */
function repositoryRoot(link: string | undefined): string | undefined {
  if (!link) return undefined;
  const match = /^(https?:\/\/(?:www\.)?github\.com\/[^/?#]+\/[^/?#]+)/.exec(link);
  return match?.[1];
}

const OG_CARD = { width: 1200, height: 630 } as const;

const KEYWORD_LIMIT = 12;

export interface ArtifactStats {
  words: number;
  /** Whole minutes, floored at 1 for any non-empty story. */
  minutes: number;
  /** ISO 8601 duration, which is what `timeRequired` expects. */
  timeRequired: string;
}

export interface ArtifactSocialImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface Crumb {
  name: string;
  url: string;
}

/** `03` — the serial the page, the card, and llms.txt all print. */
export function artifactSerial(artifact: Artifact): string {
  return String(artifact.serial_number).padStart(2, "0");
}

/**
 * The artifact's own opening paragraph, so a search result or an answer engine
 * describes the work in the author's words rather than boilerplate.
 */
export function artifactDescription(artifact: Artifact, maxLength = 300): string {
  return artifactExcerpt(artifact.story_markdown, maxLength) || DEFAULT_DESCRIPTION;
}

export function artifactStats(story: string | null | undefined): ArtifactStats {
  if (!story?.trim()) return { words: 0, minutes: 0, timeRequired: "PT0M" };

  const stats = readingTime(story);
  const minutes = Math.max(1, Math.round(stats.minutes));
  return { words: stats.words, minutes, timeRequired: `PT${minutes}M` };
}

/**
 * The vocabulary an artifact is allowed to claim.
 *
 * Drawn from the same named areas the identity graph declares and from the
 * project registry, never from a keyword tool: a term only becomes a keyword
 * when it literally appears in the artifact's own text, which keeps
 * `TechArticle.keywords` a description of the work rather than an assertion
 * about it.
 */
function keywordVocabulary(): string[] {
  const terms = new Map<string, string>();

  const add = (raw: string) => {
    // "Quantization (INT8)" and "PEFT / LoRA" are two terms each, not one.
    for (const part of raw
      .replace(/[()]/g, " ")
      .split(/\s*[/,]\s*|\s{2,}/)) {
      const term = part.trim();
      if (term.length < 2 || term.length > 40) continue;
      // One term per spelling, case-insensitively: a story must not claim both
      // "prefix caching" and "Prefix Caching".
      const key = term.toLowerCase();
      if (!terms.has(key)) terms.set(key, term);
    }
  };

  for (const area of KNOWS_ABOUT) add(area);
  for (const project of getAllProjects()) {
    add(project.title);
    for (const item of project.stack) add(item);
    for (const item of project.keywords) add(item);
  }

  return [...terms.values()];
}

/**
 * Topical terms this artifact actually uses, in the order the story raises
 * them — so the first keywords are what the piece is genuinely about.
 */
export function artifactKeywords(story: string | null | undefined): string[] {
  if (!story?.trim()) return [];

  const haystack = story.toLowerCase();
  const matches: { term: string; at: number }[] = [];

  for (const term of keywordVocabulary()) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Word-ish boundaries: "INT8" must not match inside "INT8KV", and "vLLM"
    // must still match at the start of a sentence.
    const pattern = new RegExp(`(?<![\\w])${escaped}(?![\\w])`, "i");
    const found = pattern.exec(haystack);
    if (found) matches.push({ term, at: found.index });
  }

  const specific = matches.filter(
    (match) =>
      !matches.some(
        (other) =>
          other !== match &&
          other.term.length > match.term.length &&
          other.term.toLowerCase().includes(match.term.toLowerCase())
      )
  );

  return specific
    .sort((a, b) => a.at - b.at || a.term.localeCompare(b.term))
    .slice(0, KEYWORD_LIMIT)
    .map((match) => match.term);
}

/** The generated fallback card, used when an artifact has no screenshot. */
export function artifactOgCardUrl(slug: string): string {
  return `${SITE_URL}/og/artifacts/${slug}`;
}

export function artifactSocialAlt(artifact: Artifact): string {
  return `${artifact.artifact_name} — artifact ${artifactSerial(artifact)}`;
}

/**
 * The image a share or a search result should show.
 *
 * A real architecture still wins when one exists — it shows the work — and the
 * generated card covers the artifacts that have no media at all, which is what
 * used to leave `og:image` empty. A stored upload's pixel size is unknown, so
 * only the card declares dimensions: a wrong width letterboxes every card,
 * an absent one costs nothing.
 */
export function artifactSocialImage(artifact: Artifact): ArtifactSocialImage {
  const still = artifact.architecture_images.find(
    (media) => !isVideoUrl(media.url)
  );

  if (still) {
    return {
      url: still.url,
      alt: still.alt || `${artifact.artifact_name} architecture`,
    };
  }

  return {
    url: artifactOgCardUrl(artifact.slug),
    alt: artifactSocialAlt(artifact),
    ...OG_CARD,
  };
}

/** `Home → Artifacts → this artifact`, shared by the trail and the JSON-LD. */
export function artifactBreadcrumbs(artifact: Artifact): Crumb[] {
  return [
    { name: "Home", url: SITE_URL },
    { name: "Artifacts", url: `${SITE_URL}/artifacts` },
    {
      name: artifact.artifact_name,
      url: `${SITE_URL}/artifacts/${artifact.slug}`,
    },
  ];
}

/**
 * One artifact as a list entry, for a listing page to publish.
 *
 * The `@id` is the same one the artifact's own page declares, so a crawler that
 * reads the list and then the page merges two documents into one node rather
 * than learning about the same work twice.
 */
export function buildArtifactListItem(
  artifact: Artifact,
  position: number,
  baseUrl = `${SITE_URL}/artifacts`
): Record<string, unknown> {
  const stats = artifactStats(artifact.story_markdown);
  const social = artifactSocialImage(artifact);
  const canonical = `${baseUrl}/${artifact.slug}`;

  return {
    "@type": "ListItem",
    position,
    item: {
      "@type": ["Article", "TechArticle"],
      "@id": `${canonical}#article`,
      url: canonical,
      name: artifact.artifact_name,
      headline: artifact.artifact_name,
      description: artifactExcerpt(artifact.story_markdown, 200) || undefined,
      datePublished: artifact.published_at ?? undefined,
      dateModified: artifact.updated_at,
      inLanguage: "en-US",
      timeRequired: stats.minutes > 0 ? stats.timeRequired : undefined,
      image: [social.url],
      author: { "@id": PERSON_ID },
    },
  };
}

export function buildArtifactItemList(
  artifacts: Artifact[],
  id: string,
  name?: string,
  baseUrl = `${SITE_URL}/artifacts`
): Record<string, unknown> {
  return {
    "@type": "ItemList",
    "@id": id,
    name,
    numberOfItems: artifacts.length,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: artifacts.map((artifact, index) =>
      buildArtifactListItem(artifact, index + 1, baseUrl)
    ),
  };
}

export function buildArtifactMetadata(artifact: Artifact): Metadata {
  const url = `${SITE_URL}/artifacts/${artifact.slug}`;
  const social = artifactSocialImage(artifact);
  const description = artifactDescription(artifact);
  const keywords = artifactKeywords(artifact.story_markdown);

  return {
    title: `${artifact.artifact_name} | ${PERSON_NAME}`,
    description,
    keywords,
    authors: [{ name: PERSON_NAME, url: SITE_URL }],
    creator: PERSON_NAME,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      // Leads with the artifact: the serial is a site conceit, not a query.
      title: `${artifact.artifact_name} — artifact ${artifactSerial(artifact)}`,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      publishedTime: artifact.published_at ?? undefined,
      modifiedTime: artifact.updated_at,
      authors: [PERSON_NAME],
      section: ARTICLE_SECTION,
      tags: keywords,
      images: [
        {
          url: social.url,
          alt: social.alt,
          width: social.width,
          height: social.height,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${artifact.artifact_name} — artifact ${artifactSerial(artifact)}`,
      description,
      images: [social.url],
    },
  };
}

/**
 * The full `@graph` for one artifact page: the article, its demo video when it
 * has one, and the breadcrumb trail.
 *
 * `author` and `publisher` are `@id` references into the identity graph in the
 * root layout rather than inline copies. An answer engine that has already read
 * any page of this site resolves them to the one Person node that carries
 * `sameAs`, `knowsAbout`, and the rest — which is the difference between "some
 * author" and "the Abhinandan whose vLLM PR I can see on GitHub".
 */
export function buildArtifactJsonLd(artifact: Artifact): Record<string, unknown> {
  const url = `${SITE_URL}/artifacts/${artifact.slug}`;
  const stats = artifactStats(artifact.story_markdown);
  const keywords = artifactKeywords(artifact.story_markdown);
  const social = artifactSocialImage(artifact);
  const youtubeId = extractYouTubeId(artifact.demo_youtube_url);
  const embedUrl = youtubeEmbedUrl(artifact.demo_youtube_url);

  // Section ids are emitted by the renderer, from this same slugger, so every
  // fragment listed here is one the page can actually scroll to — and the
  // visible section list links to.
  const sections = extractHeadings(artifact.story_markdown, { maxDepth: 3 });

  const stills = artifact.architecture_images.filter(
    (media) => !isVideoUrl(media.url)
  );

  // Images as nodes rather than bare URLs: creator/creditText/copyrightHolder
  // are what Google's image metadata reads, and `og:image` alone is only one of
  // the inputs to a Search or Discover thumbnail (`primaryImageOfPage` is
  // another). The primary image is whichever one the card would show.
  const imageObjects = [
    ...new Map(
      [
        ...stills.map((still) => ({
          url: still.url,
          caption: still.caption?.trim() || still.alt,
        })),
        { url: social.url, caption: social.alt },
      ].map((image) => [image.url, image])
    ).values(),
  ].map((image) => ({
    "@type": "ImageObject",
    ...(image.url === social.url
      ? {
          "@id": `${url}#primaryimage`,
          ...(social.width ? { width: social.width, height: social.height } : {}),
        }
      : {}),
    url: image.url,
    contentUrl: image.url,
    caption: image.caption,
    creator: { "@id": PERSON_ID },
    creditText: PERSON_NAME,
    copyrightHolder: { "@id": PERSON_ID },
  }));

  // The software the artifact documents, when it links to it. A
  // SoftwareSourceCode node is a more accurate entity for "the thing I built"
  // than leaving the repository as a bare link on the page.
  // Only links that actually point at code. The `github_links` field is used
  // for whatever a write-up should link — a PR, a repo, or a thread on X — and
  // a tweet is not a SoftwareSourceCode.
  const links = artifact.github_links.map((link) => link.url).filter(Boolean);
  const codeLinks = links.filter((link) => CODE_HOST.test(link));
  const repository =
    codeLinks.find((link) => REPO_ROOT.test(link)) ??
    repositoryRoot(codeLinks[0]);
  const code =
    codeLinks.length > 0 && repository
      ? {
          "@type": "SoftwareSourceCode",
          "@id": `${url}#code`,
          // The software has a name of its own, and the repo path carries it.
          name:
            new URL(repository).pathname.replace(/\/$/, "").split("/").pop() ??
            artifact.artifact_name,
          description: `Source code for ${artifact.artifact_name}.`,
          codeRepository: repository,
          url: codeLinks.length === 1 ? codeLinks[0] : codeLinks,
          author: { "@id": PERSON_ID },
        }
      : null;

  const webPage = {
    "@type": "WebPage",
    "@id": url,
    url,
    name: artifact.artifact_name,
    inLanguage: "en-US",
    isPartOf: { "@id": WEBSITE_ID },
    breadcrumb: { "@id": `${url}#breadcrumbs` },
    primaryImageOfPage: { "@id": `${url}#primaryimage` },
    datePublished: artifact.published_at ?? undefined,
    dateModified: artifact.updated_at,
  };

  const article: Record<string, unknown> = {
    // Dual-typed: TechArticle is the accurate schema.org type, Article is the
    // one Google's rich-result documentation names. Both cost nothing.
    "@type": ["Article", "TechArticle"],
    "@id": `${url}#article`,
    headline: artifact.artifact_name,
    name: artifact.artifact_name,
    description: artifactDescription(artifact),
    url,
    mainEntityOfPage: { "@id": url },
    datePublished: artifact.published_at ?? undefined,
    dateModified: artifact.updated_at,
    inLanguage: "en-US",
    isAccessibleForFree: true,
    video: youtubeId ? { "@id": `${url}#video` } : undefined,
    wordCount: stats.words,
    timeRequired: stats.timeRequired,
    articleSection: ARTICLE_SECTION,
    keywords,
    image: imageObjects,
    thumbnailUrl: social.url,
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
    isPartOf: { "@id": WEBSITE_ID },
    about: code ? { "@id": `${url}#code` } : undefined,
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: { "@type": "ViewAction" },
      userInteractionCount: artifact.view_count,
    },
    hasPart: sections.map((section) => ({
      "@type": "WebPageElement",
      "@id": `${url}#${section.id}`,
      name: section.text,
      url: `${url}#${section.id}`,
    })),
  };

  // Google's video rich result needs name, description, thumbnail, upload date
  // and an embed/content URL. `hqdefault` is the one thumbnail every public
  // YouTube video is guaranteed to have; `maxresdefault` 404s on anything
  // uploaded below 720p, and a dead thumbnail voids the whole node.
  const video =
    youtubeId && embedUrl
      ? {
          "@type": "VideoObject",
          "@id": `${url}#video`,
          name: `${artifact.artifact_name} — demo`,
          description: `Demo of ${artifact.artifact_name}: ${artifactDescription(artifact, 200)}`,
          thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
          uploadDate: artifact.published_at ?? artifact.created_at,
          embedUrl,
          contentUrl: artifact.demo_youtube_url,
          url: artifact.demo_youtube_url,
          inLanguage: "en-US",
          isFamilyFriendly: true,
          creator: { "@id": PERSON_ID },
          publisher: { "@id": PERSON_ID },
          about: { "@id": `${url}#article` },
        }
      : null;

  const breadcrumbs = {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumbs`,
    itemListElement: artifactBreadcrumbs(artifact).map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      webPage,
      article,
      ...(video ? [video] : []),
      ...(code ? [code] : []),
      breadcrumbs,
    ],
  };
}
