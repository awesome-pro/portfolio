<!-- PLACEHOLDER: Add a full-width banner screenshot of abhinandan.one here -->
<!-- Recommended: 1400×700px, light + dark side-by-side or hero screenshot -->

# abhinandan.one

Personal site and engineering portfolio — live at **[abhinandan.one](https://abhinandan.one)**

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-SSR-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)

---

Not a template. Every section is handwritten — no theme purchased, no starter cloned past the initial scaffold. This is the actual production site with a custom CMS, real-time features, auth-gated admin, and a blog platform built from scratch.

---

## What's inside

### Portfolio sections

| Section | What it does |
|---|---|
| **Hero** | Intro with image, CTA to book a call |
| **Projects** | Media carousel per project (image + video), stack tags, live/GitHub links |
| **Experience** | Timeline with company, role, bullets — rendered from typed data |
| **Skills** | Grouped by AI/ML, languages, and infrastructure |
| **About** | Prose + stats grid |
| **Depth** | Five specific architectural calls with reasoning — not a skills list |
| **Blog** | Latest posts pulled from Supabase, linked to full blog routes |

### Blog platform

Built from scratch. No third-party CMS.

- **Editor** — [Tiptap](https://tiptap.dev) with code blocks (lowlight syntax highlighting), YouTube embeds, image uploads, placeholder hints, and link handling. All extensions are wired and typesafe.
- **Rendering** — Markdown → HTML via `react-markdown` with `remark-gfm` and `rehype-highlight`. Reading time calculated at runtime.
- **Data access** — Three Supabase client variants, each for a different rendering context:
  - `server` — for SSR routes (uses cookies)
  - `static` — for build-time generation / ISR (no cookies, safe in `generateStaticParams`)
  - `service` — for admin operations requiring elevated access
- **Engagement** — Views and likes tracked via API routes (`/api/blog-stats/[slug]`), written to Supabase on each visit
- **OG images** — Dynamic per-post Open Graph image generated at `app/blogs/[slug]/opengraph-image.tsx`
- **Sitemap** — Auto-generated at build time from all published blog slugs

### Admin CMS

All admin routes protected by a middleware proxy (`proxy.ts`) that validates the Supabase JWT session server-side and redirects unauthenticated requests to `/admin/login`.

- Blog CRUD — create, edit, publish/unpublish drafts, delete
- Image uploads to Supabase Storage via `/api/upload` (multipart, with public URL returned)
- Contribution repo tracker — a personal tool for tracking open-source targets, backed by a Postgres table with status workflow and indexed queries (schema in `migrations/`)

### Real-time and analytics

- **Visitor counter** — increments on each page load via `/api/visitors`, displayed live
- **Vercel Analytics + Speed Insights** — zero-config, no cookie banners
- **Resume redirect** — `/resume` permanently redirects to the Google Docs resume via `next.config.ts`

### CI/CD

- GitHub Actions with automated Claude-powered code review on every PR
- Deployed to Vercel on push to `main`

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16.2 (App Router) | Bleeding-edge RSC, nested layouts, route handlers |
| UI | React 19 + Tailwind CSS 4 | Concurrent features, native CSS cascade layers |
| Language | TypeScript 5 | Strict, no `any` at boundaries |
| Database | Supabase (Postgres) | Row-level security, auth, storage, realtime — one platform |
| Auth | Supabase Auth + SSR cookies | Server-side session validation, no client-side JWT exposure |
| Editor | Tiptap 3 | ProseMirror-based, fully extensible, no vendor lock-in |
| Styling components | shadcn/ui + Radix UI | Headless, unstyled primitives — no fighting the CSS |
| Package manager | pnpm 10 | Workspaces, strict linking, fast |

---

## Local development

```bash
# 1. Clone
git clone https://github.com/awesome-pro/portfolio.git
cd portfolio

# 2. Install
pnpm install

# 3. Copy env and fill in values (see table below)
cp .env.example .env.local

# 4. Run
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin dashboard is at `/admin/login` — requires a Supabase user account.

---

## Environment variables

| Variable | Where it's used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All Supabase clients (public, safe for client) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public read operations (client + SSR) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin operations, bypasses RLS |
| `BLOG_API_KEY` | Internal API route authentication for write operations |

Copy `.env.example` to `.env.local` and fill in values. The public site routes work with only the anon key; admin and write operations require the service role key and API key.

---

## Database

Migrations live in `migrations/`. Apply them in the Supabase SQL editor or via the CLI.

| Table | Purpose |
|---|---|
| `blogs` | Published posts, drafts, tags, views, likes |
| `contribution_targets` | Personal open-source contribution tracker |

---

## Screenshots

<!-- PLACEHOLDER: Add screenshots of the following -->
<!-- 1. Homepage hero — mobile + desktop -->
<!-- 2. Projects section (carousel open on agenteval or Orchflow) -->
<!-- 3. Blog listing page -->
<!-- 4. Blog post with code block -->
<!-- 5. Admin blog editor (Tiptap) -->

---

## Projects featured

| Project | What it is |
|---|---|
| [agenteval](https://github.com/awesome-pro/agenteval) | Python CLI/package for LLM agent testing — behavioral assertions, tool-call tracing, OpenAI/Anthropic adapters, PyPI-published |
| [Orchflow](https://github.com/awesome-pro/orchflow) | Dependency-free Python 3.11+ multi-agent orchestration framework — sequential, parallel, conditional, retryable flows, checkpoint/resume |
| Low-Latency Inference Layer | Caching and batching layer in front of foundation model endpoints — Redis-backed, deployed on AWS |
| [NewTools](https://newtools.space) | Privacy-first browser utility platform — Claude API with SSE streaming, zero server-side data storage |

---

## Recognition

- Top 1% TypeScript Engineer Globally · [Algora](https://algora.io/profile/awesome-pro)
- HDFC Badhate Kadam Scholar
- Reliance Foundation Scholar
- Amazon ML Summer School 2025
- 2nd Place · Outlier AI Hackathon
- IYMC Gold Honour

---

## Contact

[hi@abhinandan.one](mailto:hi@abhinandan.one) · [abhinandan.one](https://abhinandan.one)
