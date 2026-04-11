// Validates the Authorization: Bearer <key> header on API requests.
export function validateApiKey(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const key = authHeader.slice(7);
  return key === process.env.BLOG_API_KEY && key.length > 0;
}

export function unauthorizedResponse() {
  return Response.json(
    { error: "Unauthorized. Provide a valid Authorization: Bearer <key> header." },
    { status: 401 }
  );
}
