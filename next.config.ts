import type { NextConfig } from "next";

/**
 * The same permission the robots.txt states, carried on the response itself.
 *
 * aipref-attach defines `Content-Usage` as both a robots.txt rule and an HTTP
 * header field, and Cloudflare's Markdown-for-Agents reads `content-signal`
 * from origin — injecting a permissive default when the origin sets none. A
 * header travels with non-HTML resources (images, the generated cards), applies
 * whatever a proxy does to robots.txt, and costs one line here.
 *
 * /admin and /api carry it too: robots.txt already fences both off, and the
 * statement is about content reuse, not access.
 */
const CONTENT_SIGNALS = [
  { key: "Content-Usage", value: "search=y, ai-use=y, train-ai=y" },
  {
    key: "Content-Signal",
    value: "search=yes, ai-input=yes, ai-train=yes, use=full",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: CONTENT_SIGNALS }];
  },

  /**
   * `data/resume.tex` is read at render time rather than imported, so the
   * tracer cannot see it: it is joined from `process.cwd()` at runtime. The
   * routes that publish the resume therefore have to name it, or the file is
   * missing from the serverless bundle and `/resume.txt` and the llms indexes
   * lose the resume only once deployed.
   *
   * `/resume.txt` is prerendered, so it needs nothing at request time; it is
   * listed anyway so that dropping `force-static` cannot silently break it.
   */
  outputFileTracingIncludes: {
    "/resume.txt": ["./data/resume.tex"],
    "/llms.txt": ["./data/resume.tex"],
    "/llms-full.txt": ["./data/resume.tex"],
  },

  // No serverActions.bodySizeLimit override on purpose: architecture media is
  // uploaded straight to Supabase Storage from the browser using a pre-signed
  // URL, so uploads never pass through a Server Action. The previous 12mb
  // override only existed to carry images through one, and it is not needed by
  // any remaining action — the largest payload we send is the story markdown,
  // currently ~11KB against Next's 1MB default.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
