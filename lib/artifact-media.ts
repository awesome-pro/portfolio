// Client-safe helpers for artifact media (images and architecture video).
//
// Deliberately has NO imports, so it is safe to use from client components.
// `lib/artifacts.ts` imports the service-role Supabase client, so client
// components must only ever `import type` from there — never a value.

/** Extensions the markdown renderer turns into a native <video> player. */
export const VIDEO_FILE_PATTERN = /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i;

export function isVideoUrl(url: string | null | undefined): boolean {
  return typeof url === "string" && VIDEO_FILE_PATTERN.test(url);
}

/** Mirrors the `artifact-images` bucket's allowed_mime_types. */
export const ALLOWED_MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/ogg",
] as const;

export const MEDIA_ACCEPT = "image/*,video/mp4,video/webm,video/quicktime,video/x-m4v,video/ogg";

/**
 * The bucket allows 50MB for everything, but a 50MB *image* is almost always a
 * mistake, so images keep a tighter client-side budget.
 */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export function maxBytesFor(contentType: string): number {
  return contentType.startsWith("video/") ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

export function formatMegabytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
