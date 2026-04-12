import { createServiceClient } from "@/lib/supabase/service";

/**
 * GET /api/visitors
 * Returns { today: number, total: number } without incrementing.
 */
export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("visitor_stats")
    .select("date, count");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = data?.find((r) => r.date === todayStr)?.count ?? 0;
  const total = data?.reduce((sum, r) => sum + r.count, 0) ?? 0;

  return Response.json({ today, total });
}

/**
 * POST /api/visitors
 * Increments today's visit count, returns { today: number, total: number }.
 */
export async function POST() {
  const supabase = createServiceClient();
  const todayStr = new Date().toISOString().slice(0, 10);

  // Upsert: insert today's row or increment existing count
  const { error: upsertError } = await supabase.rpc("increment_visitor_count", {
    p_date: todayStr,
  });

  if (upsertError) {
    return Response.json({ error: upsertError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("visitor_stats")
    .select("date, count");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const today = data?.find((r) => r.date === todayStr)?.count ?? 0;
  const total = data?.reduce((sum, r) => sum + r.count, 0) ?? 0;

  return Response.json({ today, total });
}
