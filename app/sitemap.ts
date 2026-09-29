import type { MetadataRoute } from "next";
import { getPublicArtifacts } from "@/lib/artifacts";
import { getAllProjects } from "@/lib/projects";
import { SITE_URL } from "@/lib/identity";

export const revalidate = 30;

/** A malformed or missing date must drop the field, not emit "Invalid Date". */
function dateOrUndefined(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * `lastModified` is the date the content actually changed, never "now".
 *
 * Every entry used to claim `new Date()`, which is a freshness claim a crawler
 * can catch you in: four pages that never change cannot all have been modified
 * in the same second, every time it looks. Artifact and project pages carry
 * their own dates; the pages that genuinely have no date (the resumes, the
 * GitHub-fed contribution list) now omit the field rather than invent one.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const artifacts = await getPublicArtifacts();
  const projects = getAllProjects().filter((project) => project.hasPage);

  // ISO dates sort lexicographically, so the max is the newest.
  const artifactDates = artifacts
    .map((artifact) => artifact.published_at ?? artifact.updated_at)
    .filter((date): date is string => Boolean(date))
    .sort();
  const newestArtifact = artifactDates.at(-1);

  const projectDates = projects.map((project) => project.date).sort();
  const newestProject = projectDates.at(-1);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: dateOrUndefined(newestArtifact),
      changeFrequency: "weekly",
      priority: 1,
      images: [`${SITE_URL}/hero.jpg`, `${SITE_URL}/hero-photo.jpg`],
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/projects`,
      lastModified: dateOrUndefined(newestProject),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/artifacts`,
      lastModified: dateOrUndefined(newestArtifact),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contributions`,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/resume`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/ml_resume`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/forward_deployed_resume`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${SITE_URL}/${project.slug}`,
    lastModified: dateOrUndefined(project.date),
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  const artifactRoutes: MetadataRoute.Sitemap = artifacts.map((artifact) => ({
    url: `${SITE_URL}/artifacts/${artifact.slug}`,
    lastModified: dateOrUndefined(artifact.updated_at ?? artifact.published_at),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...projectRoutes, ...artifactRoutes];
}
