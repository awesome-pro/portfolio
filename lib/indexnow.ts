// IndexNow: telling Bing (and therefore Copilot grounding) that a URL changed.
//
// `dateModified` in structured data only helps once a crawler decides to come
// back. IndexNow is the push half of that: publish or edit an artifact and the
// URL is queued for re-crawl instead of waiting for a schedule.
//
// The key below is public by design — it proves control of the host only by
// being served from it, at the file this module points IndexNow at.

import { SITE_URL } from "@/lib/identity";

/** 32 hex characters, as the protocol requires (8–128). */
export const INDEXNOW_KEY = "6f2b9c4d18ae47f3b0d5e8c1a37f9042";

export const INDEXNOW_KEY_PATH = "/indexnow-key.txt";

const ENDPOINT = "https://api.indexnow.org/indexnow";

/** A ping must never hold up a save, and must never surface as a save error. */
const TIMEOUT_MS = 4000;

/**
 * Submits changed URLs to the shared IndexNow endpoint. Bing, Yandex, Seznam
 * and Naver all read it; Google does not, and does not need to — it has the
 * sitemap and a crawl budget for eight pages.
 *
 * Call it from `after()` so the response goes out first.
 */
export async function submitToIndexNow(urls: string[]): Promise<void> {
  const unique = [...new Set(urls)].filter((url) => url.startsWith(SITE_URL));
  if (unique.length === 0) return;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}${INDEXNOW_KEY_PATH}`,
        urlList: unique,
      }),
      signal: controller.signal,
    });
  } catch {
    // A search engine being unreachable is not the author's problem, and the
    // next save will try again.
  } finally {
    clearTimeout(timer);
  }
}
