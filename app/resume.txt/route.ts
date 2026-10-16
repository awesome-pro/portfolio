import { loadResume, resumeDocument } from "@/lib/resume";

/**
 * `/resume.txt` — the resume as text, for the reader that cannot open the PDF.
 *
 * A human opens `/resume` and reads `public/resume.pdf`. An agent fetching the
 * same page gets an `<iframe>` pointing at a PDF and has to parse it, so this
 * route publishes the identical words as text. It is not a summary and not a
 * second copy: `lib/resume.ts` reduces `data/resume.tex` — the source the PDF is
 * typeset from — so the two cannot describe different careers.
 *
 * Rendered once at build time. The resume only changes when the `.tex` changes,
 * which is a deploy, so there is nothing to revalidate and no file to read at
 * request time.
 */
export const dynamic = "force-static";

export async function GET() {
  const resume = await loadResume();

  return new Response(resumeDocument(resume), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
