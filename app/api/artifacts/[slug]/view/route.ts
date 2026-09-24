import { createServiceClient } from "@/lib/supabase/service";

/** Writes on every call: never prerender or cache this. */
export const dynamic = "force-dynamic";

/**
 * POST /api/artifacts/[slug]/view
 *
 * Counts one read of an artifact and returns the new total:
 *   { slug: string, view_count: number }
 *
 * The work happens in the `increment_artifact_view` Postgres function (see
 * migrations/artifact_views.sql) so concurrent visitors cannot lose a count.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc("increment_artifact_view", {
    p_slug: slug,
  });

  if (error) {
    return Response.json(
      { error: error.message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  // The function returns null when no row matched the slug.
  if (typeof data !== "number") {
    return Response.json(
      { error: "Unknown artifact slug" },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  return Response.json(
    { slug, view_count: data },
    { headers: { "Cache-Control": "no-store" } }
  );
}
