import type { MetadataRoute } from "next";
import { getAllSlugsStatic } from "@/lib/blogs";
import { getAllArtifactSlugsStatic } from "@/lib/artifacts";
import { getAllProjects } from "@/lib/projects";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://abhinandan.one";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
      images: [`${base}/hero.png`, `${base}/hero-photo.jpg`],
    },
    {
      url: `${base}/projects`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${base}/blogs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/artifacts`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/resume`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/ml_resume`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/forward_deployed_resume`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // Project case-study pages (only those with a dedicated page)
  const projectRoutes: MetadataRoute.Sitemap = getAllProjects()
    .filter((p) => p.hasPage)
    .map((p) => ({
      url: `${base}/${p.slug}`,
      lastModified: new Date(p.date),
      changeFrequency: "monthly" as const,
      priority: 0.85,
    }));

  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllSlugsStatic();
    blogRoutes = slugs.map((slug) => ({
      url: `${base}/blogs/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch {
    // If Supabase is unavailable during build, skip blog routes
  }

  let artifactRoutes: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllArtifactSlugsStatic();
    artifactRoutes = slugs.map((slug) => ({
      url: `${base}/artifacts/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch {
    // If Supabase is unavailable during build, skip artifact routes
  }

  return [...staticRoutes, ...projectRoutes, ...blogRoutes, ...artifactRoutes];
}
