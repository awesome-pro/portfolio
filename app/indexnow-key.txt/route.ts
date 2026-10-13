// The IndexNow key file.
//
// IndexNow verifies that whoever submits a URL controls the host by fetching
// this path and comparing it to the key in the submission. It is public on
// purpose: the key is not a secret, it is a proof of ownership.
//
// Served from a folder named `indexnow-key.txt` for the same reason `llms.txt`
// is — the protocol asks for a literal path, and a route segment can be one.

import { INDEXNOW_KEY } from "@/lib/indexnow";

export const dynamic = "force-static";

export function GET() {
  return new Response(INDEXNOW_KEY, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}
