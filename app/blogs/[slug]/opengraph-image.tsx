import { ImageResponse } from "next/og";
import { getBlogBySlugStatic } from "@/lib/blogs";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await getBlogBySlugStatic(slug);

  const title = blog?.title ?? "Blog Post";
  const excerpt = blog?.excerpt ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "64px",
          backgroundColor: "#0a0a0a",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Cover image as background if available */}
        {blog?.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blog.cover_image_url}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.25,
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(10,10,10,0.95) 60%, rgba(10,10,10,0.4) 100%)",
          }}
        />

        {/* Content */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "16px" }}>
          {blog?.tags && blog.tags.length > 0 && (
            <div style={{ display: "flex", gap: "8px" }}>
              {blog.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: "14px",
                    fontFamily: "monospace",
                    color: "#888",
                    border: "1px solid #333",
                    borderRadius: "999px",
                    padding: "4px 12px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div
            style={{
              fontSize: "52px",
              fontWeight: "bold",
              color: "#f5f5f5",
              lineHeight: 1.15,
              maxWidth: "900px",
            }}
          >
            {title}
          </div>

          {excerpt && (
            <div
              style={{
                fontSize: "22px",
                color: "#888",
                lineHeight: 1.5,
                maxWidth: "800px",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {excerpt}
            </div>
          )}

          <div
            style={{
              fontSize: "16px",
              fontFamily: "monospace",
              color: "#555",
              marginTop: "8px",
            }}
          >
            abhinandan.one/blogs
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
