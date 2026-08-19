<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Writing `story_markdown` for artifacts

`story_markdown` (the artifact's main body, edited via `ArtifactForm` at `/admin/create` or `/admin/artifacts/new`) is rendered by `components/artifacts/ArtifactMarkdown.tsx` using `react-markdown` + `remark-gfm` + `rehype-highlight`. Keep these rules in mind when writing or generating it:

- **Images** — standard `![alt](url)` works with *any* external URL, not just Supabase Storage. It renders as a plain `<img>`, so there's no Next.js Image domain allowlist to worry about — GitHub URLs (`github.com/user.png`, `raw.githubusercontent.com/...`), Unsplash, etc. all just work.
- **Video files** — use image syntax (`![caption](url)`) pointing at a URL ending in `.mp4`, `.webm`, `.mov`, `.m4v`, or `.ogv` (query strings are fine). It automatically renders as a native `<video controls>` player instead of an `<img>`.
- **YouTube embeds** — put a YouTube link **alone on its own line** (either a bare URL or `[text](url)`) and it renders as a responsive embedded player, matching the dedicated demo-video section. A YouTube link used **inline mid-sentence** stays a plain clickable link instead — so don't rely on inline links to embed.
- **No raw HTML** — `<iframe>`, `<script>`, etc. typed directly into the markdown are stripped, not rendered. Use the "YouTube link on its own line" pattern above instead of hand-writing an iframe.
- **Full GFM support** — tables, task lists (`- [ ]` / `- [x]`), strikethrough (`~~text~~`), and autolinked bare URLs all work.
- **Code blocks** — fence with a language tag (e.g. ```` ```ts ````) for syntax highlighting; they render with a copy button.
- The dedicated `demo_youtube_url` field (optional — an artifact can be markdown-only with no video) is separate from any videos embedded inside `story_markdown` itself; use it for the primary hero demo, and inline YouTube links in the body for anything else worth embedding.
