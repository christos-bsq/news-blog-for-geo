# GEO / AEO Experiment Site — Implementation Brief (Astro Microblog + Netlify)

## 1. Overview

We want to build a small, production-grade website to run **GEO / AEO experiments** (Generative/Answer Engine Optimization) — i.e. how AI/answer engines and classic search bots crawl, understand, and rank content.

The site should look like a **normal blog / news site** (not an obviously artificial “/experiments” lab), using the **Astro microblog template**:

- Home index
- `/post/[slug]` post pages
- `/category/[slug]` category listing
- `/tags/[slug]` tag listing

Experiments (JSON-LD variants, JS-injected content, slow server responses, etc.) are controlled via **frontmatter fields** and internal logic, **not** via special experiment URLs.

The site will be deployed on **Netlify**, with:

- Static pages built by Astro (using the `microblog` template as a base)
- **Netlify Edge Functions** for server-side logging and optional server-side delay
- Logs shipped to **BigQuery** via an HTTP logging endpoint

## 2. Tech Stack

**Core:**

- Framework: **Astro**, starting from `michael-andreuzza/microblog` template
- Styling: Tailwind CSS v4 (already used by the template via `global.css`)
- Language: TypeScript where practical (Edge Functions, Netlify Functions, client-side scripts)
- Hosting / CI/CD: **Netlify**

**Content & CMS:**

- Content: Markdown files with YAML frontmatter in the repo (e.g. under `content/posts/` or whatever microblog uses)
- CMS: **Netlify CMS (Decap CMS)**, configured to edit these Markdown files via a browser UI

**Server-side logic:**

- **Netlify Edge Function** that runs for all paths (`/*`) and acts like middleware:
  - Logs each request to a logging API
  - Applies optional server-side delay based on experiment config
  - Can add an `X-Request-Id` header to the outgoing response

**Analytics / Logging:**

- Logging sink: **BigQuery**, via a separate HTTP endpoint (e.g. Cloud Run / Cloud Function) that ingests JSON logs and writes to BigQuery
- Edge Function calls this logging endpoint per request

## 3. Routing & URL Structure

Reuse the microblog template’s routing so the site looks natural and human-facing:

- `/` — Home index (recent posts)
- `/post/[slug]` — Individual articles (main experiment units)
- `/category/[slug]` — Category archive pages
- `/tags/[slug]` — Tag archive pages
- (Any other routes provided by the template, like RSS feeds, can remain)

**Important:**

- **No **``** prefix** or obviously experimental URLs.
- Experiments are represented by **frontmatter fields** (e.g. `experiment_type`) and not visible in the URL.
- Slugs should look like normal blog/news URLs: `/post/why-ai-bots-like-product-pages`, `/post/does-jsonld-help`, etc.

## 4. Content Model

### 4.0 Media (images & video)

Posts must support inline images and videos in a way that looks natural for a normal blog and is easy to manage via Netlify CMS.

**Storage & paths**

- Use Netlify CMS’ standard Git-based media management.
- Configure a global media folder, e.g. `public/uploads`.
- When authors upload images via CMS, files are stored in `public/uploads/...` and referenced with site-relative URLs (e.g. `/uploads/hero-my-experiment.jpg`).
- Astro/microblog template should serve these assets as static files (no extra config usually needed).

**Images in posts**

- Support images inserted via Markdown in the `body` field, e.g. `![Alt text](/uploads/experiment-hero.jpg)`.
- Additionally, add optional frontmatter fields for structured images:
  - `image`: main/hero image URL (string, e.g. `/uploads/experiment-hero.jpg`).
  - `image_alt`: alt text for the hero image.
- The post layout should:
  - Render the hero image (if present) near the top of the article.
  - Use `image` and `image_alt` for Open Graph / Twitter card meta tags where possible.

**Videos in posts**

- Support videos in one or both of these ways:
  1. **Embedded via Markdown/HTML** in the `body` (e.g. YouTube/Vimeo `<iframe>` or HTML5 `<video>` tags).
  2. Optional frontmatter field:
     - `video_url`: a URL for an external video (YouTube, Vimeo, etc.).
- The post layout should, if `video_url` is present:
  - Render a simple embedded player (e.g. responsive `<iframe>` wrapper) above or below the content.

**Accessibility & SEO**

- Ensure `alt` attributes are set for all images rendered from frontmatter.
- Keep image and video rendering straightforward and SEO-friendly (no heavy JS gallery required by default).

### 4.1 Base post frontmatter

### 4.1 Base post frontmatter

Start from whatever frontmatter the microblog template already uses for posts (typically something like):

````yaml
---
layout: "post"            # or similar, depending on template
title: "Some Article"
description: "Short summary..."
date: 2025-01-15
updated: 2025-01-16        # add if template doesn’t already have it
slug: "some-article"      # used in /post/[slug]
category: "SEO"           # string, or list if template supports
tags: ["seo", "ai", "analytics"]
---
Markdown body of the article.
``


### 4.2 Experiment fields (extensions)

Extend frontmatter with **experiment-focused fields** while keeping the visual site normal. For each post (experiment):

```yaml
---
# Existing fields
layout: "post"
title: "Experiment: JSON-LD vs No JSON-LD"
description: "Testing whether JSON-LD affects how bots see this article."
date: 2025-01-15
updated: 2025-01-16
slug: "jsonld-vs-no-jsonld"
category: "Experiments"         # Optional: category for grouping
tags: ["jsonld", "search", "bots"]
indexable: true                  # control robots/meta robots

# Experiment-specific fields
experiment_type: "jsonld"       # baseline | jsonld | js_injected | mixed | slow | other
render_mode: "ssr"              # ssr | js-only | mixed
server_delay_ms: 0               # server-side delay (Edge)
client_delay_ms: 0               # client-side (JS) content delay

json_ld:
  "@context": "https://schema.org"
  "@type": "NewsArticle"
  "headline": "Experiment: JSON-LD vs No JSON-LD"
---
Body markdown here
````

**Notes:**

- `experiment_type` is internal classification for analysis.
- `render_mode` controls SSR vs JS-injected content logic.
- `server_delay_ms` is used by the Edge Function if we maintain a mapping (see below).
- `client_delay_ms` is used by on-page JS to delay content rendering.
- `json_ld` is optional; posts without it become “no-JSON-LD” variants.
- `indexable` controls both sitemap inclusion and meta robots.

## 5. Page Rendering & Experiment Behavior

We reuse the microblog template’s layout structure but enhance the **post page** template(s) to support experiments.

### 5.1 Post layout responsibilities

Modify the main post layout (e.g. `src/pages/post/[slug].astro` and related components) to:

1. Read experiment frontmatter fields: `experiment_type`, `render_mode`, `client_delay_ms`, `json_ld`, etc.
2. Render standard SEO meta tags:
   - `<title>` from `title`
   - `<meta name="description">` from `description`
   - `<meta property="article:published_time">` from `date`
   - `<meta property="article:modified_time">` from `updated`
3. Render JSON-LD:
   - If `json_ld` is present, emit:

     ```html
     <script type="application/ld+json">
     {JSON.stringify(json_ld)}
     </script>
     ```

   - This is static; no JS execution required to see it.
4. Implement different **render modes**:

   ``
   - Render the markdown body as HTML inside `<main id="article-ssr">`.
   - JS may still run, but content is fully present without JS. ``
   - Do **not** render the markdown body directly.
   - Instead, render a placeholder container such as:

     ```html
     <main id="article-js"
           data-slug={frontmatter.slug}
           data-experiment-type={frontmatter.experiment_type}
           data-client-delay-ms={frontmatter.client_delay_ms ?? 0}>
     </main>
     ```

   - The actual article text is injected by client-side JS after an optional delay. ``
   - Render a short SSR header/summary, but render the full body via JS injection.
   - This allows testing partial SSR vs full SSR.

### 5.2 Client-side JavaScript module

Add a small JS module (e.g. `src/scripts/experiments.ts`) and include it on post pages.

Responsibilities:

- On DOM ready, find the `#article-js` container if present.
- Read `data-*` attributes (slug, experiment\_type, client\_delay\_ms).
- Wait `client_delay_ms` milliseconds (if > 0).
- Inject content into `#article-js`:
  - Simplest option: embed the full content as JSON in a `<script type="application/json" id="post-content">` tag during build, then parse it in JS.
  - Alternative: generate a static JSON file per post at build time (e.g. `/post-data/[slug].json`) and `fetch()` it.

The JS should be **experiment-focused but small**, so it’s easy to reason about.

## 6. Server-Side Logging & BigQuery

We want **FastAPI-style middleware logging**, but on Netlify, using an Edge Function.

### 6.1 Edge Function architecture

Create a Netlify Edge Function, e.g. `netlify/edge-functions/logging.ts`, configured for all paths (`path = "/*"`).

The Edge Function should:

1. Generate a **request ID** for this incoming request:

   - Use `crypto.randomUUID()` if available, or another unique ID method.

2. Read request information:

   - \`url\` (from `new URL(request.url)`)
   - `method` (GET/POST/etc.)
   - `user-agent` header
   - `referer` header
   - `host` header
   - `x-forwarded-for` header (for client IP chain)
   - All headers (converted to a JSON-safe object for `headers_json`)

3. Derive **experiment context** from the URL:

   - For paths like `/post/[slug]`, extract the slug.
   - Optionally, maintain a **static JSON mapping** from slug → experiment metadata generated at build time (e.g. `public/experiment-index.json`).
   - From that mapping, derive `experiment_type`, `render_mode`, `server_delay_ms`.

4. Optionally apply **server-side delay**:

   - If `server_delay_ms` is configured and > 0, do:

     ```ts
     await new Promise((resolve) => setTimeout(resolve, server_delay_ms));
     ```

5. Call `context.next()` to get the response:

   - `const response = await context.next();`
   - Read `response.status` for **response status code** (200, 301, 404, etc.).

6. Attach `X-Request-Id` header to the response for traceability:

   - Create a new response based on `response` with added header (Edge Functions allow modifying the response).

7. Build a **log payload** with all relevant fields:

   - `request_id`: unique ID per incoming request (as above)
   - `timestamp`: current UTC time (ISO)
   - `method`: HTTP method
   - `path`: `url.pathname`
   - `query`: `url.search`
   - `host`: from `request.headers.get("host")`
   - `user_agent`: UA string
   - `referer`: from `request.headers.get("referer")`
   - `x_forwarded_for`: from `request.headers.get("x-forwarded-for")`
   - `headers_json`: JSON string of all headers (or a filtered subset if too large)
   - `is_bot`: boolean via simple UA matching
   - `bot_family`: e.g. "googlebot", "bingbot", "gptbot", "perplexity", "other", "unknown"
   - `experiment_type`: from slug-to-experiment mapping
   - `render_mode`: from mapping
   - `server_delay_ms`: from mapping
   - `response_status`: `response.status`
   - `site_env`: e.g. `"production"`, `"preview"`, `"development"` (from env var)

8. Send the log **asynchronously** to a logging endpoint (an HTTP API that will write into BigQuery):

   - Endpoint URL from `LOGGING_ENDPOINT` env var
   - API key or token from `LOGGING_API_KEY` env var
   - Use `context.waitUntil(fetch(...))` so logging doesn’t delay the response further.

9. Return the (possibly header-mutated) `response`.

### 6.2 BigQuery side (out of scope for agent, but inform the schema)

The agent should document a sample JSON payload that can be used to define the BigQuery table schema, e.g.:

```json
{
  "request_id": "f6c7a49d-25f3-4e62-8df4-9f1f1fa7b22e",
  "timestamp": "2025-01-10T12:34:56.789Z",
  "method": "GET",
  "path": "/post/jsonld-vs-no-jsonld",
  "query": "",
  "host": "example.com",
  "user_agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "referer": "https://www.google.com/",
  "x_forwarded_for": "203.0.113.10, 10.0.0.1",
  "headers_json": "{...}",
  "is_bot": true,
  "bot_family": "googlebot",
  "experiment_type": "jsonld",
  "render_mode": "ssr",
  "server_delay_ms": 0,
  "response_status": 200,
  "site_env": "production"
}
```

### 6.3 About redirects and request IDs

- From the perspective of Netlify + Edge Functions, **each HTTP request** is its own event.
- A browser following a 301/302 redirect will cause **multiple requests**:
  - First to URL A → 301 → then another request to URL B.
- Each such request will:
  - Trigger the Edge Function
  - Generate its own `request_id` and log record
- If we want to correlate across a redirect chain, we can:
  - Add `X-Request-Id` to the response (as described above).
  - Optionally also include that ID in redirect targets (e.g. as a query param), though this is mostly overkill for this project.

For now, per-request IDs + paths + referers + status codes should be enough to reason about redirect behavior.

## 7. Netlify CMS Integration

### 7.1 Files and basic setup

- Add `public/admin/index.html` and `public/admin/config.yml` for Netlify CMS.
- Configure Netlify CMS to use the Git backend (GitHub) and the same repo.

### 7.2 Collections and fields

Configure a `posts` collection that maps to the microblog’s posts directory, e.g.:

```yaml
collections:
  - name: "posts"
    label: "Posts"
    folder: "src/content/posts"      # adjust to actual path
    create: true
    slug: "{{slug}}"
    fields:
      - { name: "title", label: "Title", widget: "string" }
      - { name: "image", label: "Hero Image", widget: "image", required: false }
      - { name: "image_alt", label: "Hero Image Alt Text", widget: "string", required: false }
      - { name: "video_url", label: "Video URL (YouTube/Vimeo/etc.)", widget: "string", required: false }
      - { name: "description", label: "Description", widget: "string" }
      - { name: "date", label: "Publish Date", widget: "datetime" }
      - { name: "updated", label: "Updated", widget: "datetime", required: false }
      - { name: "slug", label: "Slug", widget: "string" }
      - { name: "category", label: "Category", widget: "string" }
      - { name: "tags", label: "Tags", widget: "list", field: { name: "tag", label: "Tag", widget: "string" } }
      - { name: "indexable", label: "Indexable", widget: "boolean", default: true }
      - { name: "experiment_type", label: "Experiment Type", widget: "select", options: ["baseline", "jsonld", "js_injected", "mixed", "slow"] }
      - { name: "render_mode", label: "Render Mode", widget: "select", options: ["ssr", "js-only", "mixed"], default: "ssr" }
      - { name: "server_delay_ms", label: "Server Delay (ms)", widget: "number", default: 0, required: false }
      - { name: "client_delay_ms", label: "Client Delay (ms)", widget: "number", default: 0, required: false }
      - { name: "json_ld", label: "JSON-LD", widget: "object", required: false }
      - { name: "body", label: "Body", widget: "markdown" }
```

The agent must ensure that:

- These fields map 1:1 with the frontmatter consumed by Astro.
- Any changes to the content model are reflected both in Astro code and CMS config.

## 8. Netlify Configuration

Create a `netlify.toml` with at least:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[edge_functions]]
  path = "/*"
  function = "logging"   # name of the Edge Function file without extension
```

Environment variables (to be configured in Netlify UI, but referenced by code):

- `LOGGING_ENDPOINT` — URL of HTTP API that writes to BigQuery
- `LOGGING_API_KEY` — Token/secret for that endpoint
- `SITE_ENV` — e.g. `production`, `preview`, `development`

If necessary, the agent can also configure redirects, headers, and other Netlify features, but the core requirement is Edge Function wiring and build config.

## 9. Acceptance Criteria

The implementation should be considered complete when:

1. **Site appearance & routing**

   - The site uses the microblog Astro template look & feel (or a close variant).
   - `/`, `/post/[slug]`, `/category/[slug]`, and `/tags/[slug]` all work as expected.
   - URLs do **not** contain an `/experiments` prefix.

2. **Content authoring**

   - New posts can be created via Netlify CMS and appear on the site after deploy.

   - **New posts can also be created and edited directly in the Git repository** (e.g. committing Markdown files manually), and these changes must be picked up by Netlify builds.

   - CMS supports setting: `title`, `description`, `slug`, `category`, `tags`, `date`, `updated`, `experiment_type`, `render_mode`, `server_delay_ms`, `client_delay_ms`, `json_ld`, `indexable`, and the Markdown body.

3. **Experiment behavior**

   - It is possible to have posts that are:
     - Fully SSR (`render_mode: ssr`)
     - JS-only content (`render_mode: js-only`)
     - Mixed (`render_mode: mixed`)
   - It is possible to configure posts where:
     - Only server-side delay is applied
     - Only client-side delay is applied
     - Both delays are applied
   - When `json_ld` is present, the JSON-LD script appears in the HTML `<head>` or `<body>` and is visible in raw HTML source.

4. **Logging**

   - Every HTTP request to the site triggers the Edge Function.
   - For each request, a JSON payload is sent to the logging endpoint, containing at least:
     - `request_id`, `timestamp`, `method`, `path`, `query`, `host`, `user_agent`, `referer`, `x_forwarded_for`, `headers_json`, `is_bot`, `bot_family`, `experiment_type`, `render_mode`, `server_delay_ms`, `response_status`, `site_env`.
   - The Edge Function adds an `X-Request-Id` header to responses.

5. **Sitemap & robots**

   - `/sitemap.xml` exists and includes all `indexable: true` posts.
   - `/robots.txt` exists and references the sitemap.

6. **Build & deploy**

   - The repo can be connected to Netlify and deployed with `npm run build`.
   - Edge Function is correctly picked up and executed in the Netlify environment.

This brief should provide enough structure for an autonomous AI coding agent to implement the site, starting from the Astro microblog template and layering on experiment, logging, and CMS capabilities as described.
