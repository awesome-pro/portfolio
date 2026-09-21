// Client-safe helpers for opportunity signal links.
//
// This module deliberately has NO imports, so it is safe to pull into client
// components. `lib/opportunity-signals.ts` imports the service-role Supabase
// client, so client components must never import a *value* from there — only
// `import type`.

export interface SignalLink {
  url: string;
  title?: string;
}

/**
 * `links` is jsonb, so treat anything unexpected as "no links" rather than
 * letting a malformed row break the admin list. Objects carry a title, but
 * bare URL strings are accepted so hand-written rows still render.
 */
export function normalizeSignalLinks(value: unknown): SignalLink[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): SignalLink => {
      if (typeof item === "string") return { url: item.trim() };
      if (item && typeof item === "object" && "url" in item) {
        const record = item as { url?: unknown; title?: unknown };
        const title = record.title ? String(record.title).trim() : "";
        return {
          url: String(record.url ?? "").trim(),
          ...(title ? { title } : {}),
        };
      }
      return { url: "" };
    })
    .filter((link) => link.url);
}
