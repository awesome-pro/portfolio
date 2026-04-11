import type { MetadataRoute } from "next";
import { getAllSlugsStatic } from "@/lib/blogs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://abhinandan.one";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${base}/blogs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

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

  return [...staticRoutes, ...blogRoutes];
}
