import { getArtifactViewCounts } from "@/lib/artifacts";

/** Live numbers: never prerender or cache this. */
export const dynamic = "force-dynamic";

/**
 * GET /api/artifacts/views
 * Returns { counts: { [slug]: number } } without incrementing anything.
 *
 * The site's pages are ISR, so their HTML carries a count that can be up to
 * `revalidate` seconds old; the client refreshes it from here on load.
 */
export async function GET() {
  const counts = await getArtifactViewCounts();

  return Response.json(
    { counts },
    { headers: { "Cache-Control": "no-store" } }
  );
}
