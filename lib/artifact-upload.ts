// Client-side media upload for artifacts.
//
// Lives outside `ArtifactForm` because two places now upload media: the
// architecture-media list and the markdown writer (paste, drop, or the insert
// button). `lib/artifact-media.ts` stays import-free and client-safe; this
// module is the one that talks to the server action.

import { createArtifactUploadUrl } from "@/app/admin/artifacts/actions";
import { formatMegabytes, isVideoUrl, maxBytesFor } from "@/lib/artifact-media";

/** Files pasted or dropped straight from a clipboard have no useful name. */
const GENERIC_FILENAMES = /^(image|blob|pasted|pasted[-_ ]?image|screenshot|unknown|untitled)(\.\w+)?$/i;

export interface UploadedMedia {
  /** Public URL the object is served from. */
  url: string;
  /** Alt text derived from the filename, safe to edit afterwards. */
  alt: string;
  /** True when the stored extension renders as a <video> player. */
  isVideo: boolean;
}

export function altTextFromFilename(name: string, isVideo: boolean): string {
  if (GENERIC_FILENAMES.test(name.trim())) return isVideo ? "demo video" : "screenshot";
  const stem = name.replace(/\.[^.]+$/, "").trim();
  return stem || (isVideo ? "demo video" : "screenshot");
}

/**
 * Uploads straight to Supabase with XHR rather than fetch, because fetch still
 * has no upload-progress event and a 40MB clip with no feedback looks hung.
 */
export function putWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      // Storage returns a JSON { message } for rejections such as
      // invalid_mime_type or EntityTooLarge; surface that instead of a bare code.
      try {
        const body = JSON.parse(xhr.responseText) as { message?: string };
        reject(new Error(body.message || `Upload failed (HTTP ${xhr.status}).`));
      } catch {
        reject(new Error(`Upload failed (HTTP ${xhr.status}).`));
      }
    };

    xhr.onerror = () =>
      reject(new Error("Upload failed. Check your connection and try again."));
    xhr.ontimeout = () => reject(new Error("Upload timed out. Try again."));

    xhr.send(file);
  });
}

/**
 * Validates, uploads, and returns the public URL for one image or video.
 * Throws with a message that is safe to show the author as-is.
 */
export async function uploadArtifactMedia(
  file: File,
  group: string,
  onProgress?: (percent: number) => void
): Promise<UploadedMedia> {
  const contentType = (file.type || "").toLowerCase();
  const limit = maxBytesFor(contentType);

  if (file.size > limit) {
    throw new Error(
      `That file is ${formatMegabytes(file.size)}. The limit is ${formatMegabytes(
        limit
      )} per ${contentType.startsWith("video/") ? "video" : "image"}.`
    );
  }

  // 1. Ask the server for a pre-signed URL, then 2. PUT the bytes straight to
  // Supabase — the file never passes through a Server Action.
  const target = await createArtifactUploadUrl({
    filename: file.name,
    contentType,
    group: group || "draft",
  });

  await putWithProgress(target.uploadUrl, file, contentType, onProgress ?? (() => {}));

  const isVideo = isVideoUrl(target.publicUrl);
  return {
    url: target.publicUrl,
    alt: altTextFromFilename(file.name, isVideo),
    isVideo,
  };
}
