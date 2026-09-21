import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "abhinandan — inference engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Root social card: white wordmark on black, in the same typeface the site
 * renders in. The page's effective font is Source Serif 4 — `globals.css` sets
 * `body { font-family: var(--font-inter) }` in the base layer, but the
 * `font-serif` utility on <body> overrides it, so the wordmark is a serif.
 *
 * The face is a static SemiBold instance (wght=600, matching the hero's
 * `font-semibold`) subset to Latin, checked in under assets/fonts so the build
 * needs no network access.
 */
export default async function OGImage() {
  const sourceSerif = await readFile(
    join(process.cwd(), "assets/fonts/SourceSerif4-SemiBold.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "28px",
          padding: "80px",
          backgroundColor: "#000000",
          fontFamily: "Source Serif 4",
        }}
      >
        <div
          style={{
            fontSize: "150px",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: "#ffffff",
          }}
        >
          abhinandan
        </div>
        <div
          style={{
            fontSize: "42px",
            fontWeight: 600,
            lineHeight: 1.2,
            color: "#8a8a8a",
          }}
        >
          inference engineer
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Source Serif 4",
          data: sourceSerif,
          style: "normal",
          weight: 600,
        },
      ],
    }
  );
}
