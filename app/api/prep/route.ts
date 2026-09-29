import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Sync endpoint for the interview prep checklist.
 *
 * The checklist works without this — the browser keeps ticking either way — so
 * every response is 200 with an `ok` flag rather than an error status. The one
 * exception is a missing session, which is a real 401: this is personal
 * progress, and /api is not covered by the /admin guard in proxy.ts, so the
 * check has to live here.
 */

const TABLE = "prep_progress";

interface Row {
  item_key: string;
  done: boolean;
  updated_at: string;
}

/** Postgres: undefined_table. Means the migration has not been run yet. */
const UNDEFINED_TABLE = "42P01";

async function requireSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  if (!(await requireSession())) {
    return NextResponse.json(
      { ok: false, reason: "unauthenticated" },
      { status: 401 }
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("item_key, done, updated_at");

  if (error) {
    return NextResponse.json({
      ok: false,
      reason: error.code === UNDEFINED_TABLE ? "unavailable" : "error",
    });
  }

  const entries = ((data as Row[] | null) ?? []).map((row) => ({
    key: row.item_key,
    done: row.done,
    at: new Date(row.updated_at).getTime(),
  }));

  return NextResponse.json(
    { ok: true, entries },
    { headers: { "cache-control": "no-store" } }
  );
}

export async function POST(request: Request) {
  if (!(await requireSession())) {
    return NextResponse.json(
      { ok: false, reason: "unauthenticated" },
      { status: 401 }
    );
  }

  let body: { key?: unknown; done?: unknown; at?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-request" });
  }

  const { key, done, at } = body;
  if (typeof key !== "string" || !key || typeof done !== "boolean") {
    return NextResponse.json({ ok: false, reason: "bad-request" });
  }

  const stamp = typeof at === "number" && Number.isFinite(at) ? at : Date.now();
  const supabase = createServiceClient();
  const { error } = await supabase.from(TABLE).upsert(
    {
      item_key: key,
      done,
      updated_at: new Date(stamp).toISOString(),
    },
    { onConflict: "item_key" }
  );

  if (error) {
    return NextResponse.json({
      ok: false,
      reason: error.code === UNDEFINED_TABLE ? "unavailable" : "error",
    });
  }

  return NextResponse.json({ ok: true });
}

/** Reset: only ever called from the admin page's own "reset" button. */
export async function DELETE() {
  if (!(await requireSession())) {
    return NextResponse.json(
      { ok: false, reason: "unauthenticated" },
      { status: 401 }
    );
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .neq("item_key", "");

  if (error) {
    return NextResponse.json({
      ok: false,
      reason: error.code === UNDEFINED_TABLE ? "unavailable" : "error",
    });
  }

  return NextResponse.json({ ok: true });
}
