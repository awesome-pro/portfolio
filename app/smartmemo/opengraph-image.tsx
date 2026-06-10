import { ImageResponse } from "next/og";
import { getProject } from "@/lib/projects";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "SmartMemo — a semantic LLM cache that knows when reuse is unsafe";

export default function OGImage() {
  const project = getProject("smartmemo")!;

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
          <div style={{ fontSize: "72px", fontWeight: "bold", color: "#f5f5f5", lineHeight: 1.05 }}>
            {project.title}
          </div>
          <div style={{ fontSize: "26px", color: "#9a9a9a", lineHeight: 1.4, maxWidth: "900px" }}>
            {project.oneLiner}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          {project.headlineStat && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "44px", fontWeight: "bold", color: "#f5f5f5", fontFamily: "monospace" }}>
                {project.headlineStat.value}
              </span>
              <span style={{ fontSize: "18px", color: "#777" }}>
                {project.headlineStat.label}
              </span>
            </div>
          )}
          <span style={{ fontSize: "18px", fontFamily: "monospace", color: "#555" }}>
            abhinandan.one/projects
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
