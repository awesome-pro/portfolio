import { NextResponse } from "next/server";
import { requireSession, UNDEFINED_TABLE } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Add, reword, hide and restore checklist items.
 *
 * The page itself is static — it bakes the 487 markdown items in at build time —
 * and these changes are layered on in the browser. So adding an item is
 * immediate: no rebuild, no deploy, and the row comes back on every device.
 *
 * A client-generated key is accepted for new items (`custom-<uuid>`) so the
 * optimistic row in the browser already has its final identity and never has to
 * be re-keyed after the request lands.
 */

const TABLE = "prep_items";

interface Row {
  item_key: string;
  section_id: string;
  text: string | null;
  deleted: boolean;
  created_at: string;
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
    .select("item_key, section_id, text, deleted, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({
      ok: false,
      reason: error.code === UNDEFINED_TABLE ? "unavailable" : "error",
    });
  }

  const items = ((data as Row[] | null) ?? []).map((row) => ({
    key: row.item_key,
    sectionId: row.section_id,
    text: row.text,
    deleted: row.deleted,
  }));

  return NextResponse.json(
    { ok: true, items },
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

  let body: {
    key?: unknown;
    sectionId?: unknown;
    text?: unknown;
    deleted?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-request" });
  }

  const { key, sectionId, text, deleted } = body;
  if (typeof key !== "string" || !key || typeof sectionId !== "string") {
    return NextResponse.json({ ok: false, reason: "bad-request" });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from(TABLE).upsert(
    {
      item_key: key,
      section_id: sectionId,
      text: typeof text === "string" ? text : null,
      deleted: deleted === true,
      updated_at: new Date().toISOString(),
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

/** Hard delete, for a genuinely custom item. Base items are hidden instead. */
export async function DELETE(request: Request) {
  if (!(await requireSession())) {
    return NextResponse.json(
      { ok: false, reason: "unauthenticated" },
      { status: 401 }
    );
  }

  const key = new URL(request.url).searchParams.get("key");
  if (!key) {
    return NextResponse.json({ ok: false, reason: "bad-request" });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from(TABLE).delete().eq("item_key", key);

  if (error) {
    return NextResponse.json({
      ok: false,
      reason: error.code === UNDEFINED_TABLE ? "unavailable" : "error",
    });
  }

  return NextResponse.json({ ok: true });
}
