import { validateApiKey, unauthorizedResponse } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * POST /api/upload
 *
 * Upload an image to Supabase Storage. Supports two modes:
 *
 * ── Mode 1: Fetch from URL (recommended for agents) ──
 * Headers:
 *   Authorization: Bearer <BLOG_API_KEY>
 *   Content-Type: application/json
 * Body:
 *   { "url": "https://images.unsplash.com/photo-..." }
 *
 * ── Mode 2: Upload binary file ──
 * Headers:
 *   Authorization: Bearer <BLOG_API_KEY>
 *   Content-Type: multipart/form-data
 * Body:
 *   form field "file" = image file
 *
 * Response 200:
 * {
 *   "url": "https://xxx.supabase.co/storage/v1/object/public/blog-images/covers/..."
 * }
 */
export async function POST(request: Request) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  const supabase = createServiceClient();
  const contentType = request.headers.get("content-type") ?? "";

  let imageBuffer: ArrayBuffer;
  let mimeType: string;
  let ext: string;

  if (contentType.includes("application/json")) {
    // Mode 1: fetch from URL
    let body: { url?: string };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (!body.url || typeof body.url !== "string") {
      return Response.json({ error: "Provide a url field in the JSON body." }, { status: 400 });
    }

    let fetchRes: Response;
    try {
      fetchRes = await fetch(body.url);
      if (!fetchRes.ok) throw new Error(`HTTP ${fetchRes.status}`);
    } catch (e) {
      return Response.json({ error: `Failed to fetch image: ${e}` }, { status: 400 });
    }

    mimeType = fetchRes.headers.get("content-type") ?? "image/jpeg";
    // Strip charset or params from content-type
    mimeType = mimeType.split(";")[0].trim();
    ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    imageBuffer = await fetchRes.arrayBuffer();
  } else if (contentType.includes("multipart/form-data")) {
    // Mode 2: binary file upload
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json({ error: "Failed to parse form data." }, { status: 400 });
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return Response.json({ error: "Provide an image file in the 'file' form field." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return Response.json({ error: "File must be an image." }, { status: 400 });
    }

    mimeType = file.type;
    ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    imageBuffer = await file.arrayBuffer();
  } else {
    return Response.json(
      { error: "Content-Type must be application/json or multipart/form-data." },
      { status: 415 }
    );
  }

  const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("blog-images")
    .upload(path, imageBuffer, { contentType: mimeType, upsert: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);

  return Response.json({ url: data.publicUrl });
}
