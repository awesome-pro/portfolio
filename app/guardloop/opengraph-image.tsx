import { ImageResponse } from "next/og";
import { getProject } from "@/lib/projects";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "GuardLoop — a guardrail runtime for production AI agents";

export default function OGImage() {
  const project = getProject("guardloop")!;

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
          {project.tag}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "72px",
              fontWeight: "bold",
              color: "#f5f5f5",
              lineHeight: 1.05,
            }}
          >
            {project.title}
          </div>
          <div
            style={{
              fontSize: "26px",
              color: "#9a9a9a",
              lineHeight: 1.4,
              maxWidth: "900px",
            }}
          >
            {project.oneLiner}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: "10px" }}>
            {["cost", "tokens", "time", "tool calls"].map((t) => (
              <span
                key={t}
                style={{
                  fontSize: "16px",
                  fontFamily: "monospace",
                  color: "#888",
                  border: "1px solid #333",
                  borderRadius: "999px",
                  padding: "6px 14px",
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <span style={{ fontSize: "18px", fontFamily: "monospace", color: "#555" }}>
            abhinandan.one/projects
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
