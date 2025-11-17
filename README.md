# Signal North Daily — Astro microblog for GEO/AEO posts

This project starts from
[michael-andreuzza/microblog](https://github.com/michael-andreuzza/microblog)
and layers on the custom plumbing described in
`geo_aeo_experiment_site_netlify_astro_microblog_brief.md`: experiment-aware
posts, Netlify CMS, Netlify Edge logging, and sitemap/robots management.

## Getting started

```bash
npm install
npm run dev
npm run build
```

Both `npm run dev` and `npm run build` run `npm run generate:data` first. That
script scans every Markdown file under `src/content/posts/`, produces
`public/experiment-index.json`, and mirrors it to the Netlify Edge bundle so the
logging middleware knows the experiment settings per slug.

### Local builds and the Netlify adapter

The theme now uses the Netlify adapter so deploys can opt into SSR/middleware. On
local machines the adapter tries to move generated assets between two different
volumes (`.netlify/build/_astro` → `dist/_astro`), which fails with
`EXDEV: cross-device link not permitted`. To avoid that during local builds,
prefix your build command with:

```bash
SKIP_NETLIFY_ADAPTER=true npm run build
```

Our `astro.config.mjs` already checks this environment variable, so production
builds on Netlify continue to use the adapter with no extra configuration.

## Content authoring

- Posts live in `src/content/posts/` with the schema defined in
  `src/content/config.ts`.
- Netlify CMS is available at `/admin/` and stores media in `public/uploads/`.
- Frontmatter supports the newsroom fields (title, description, category, tags,
  hero image, video) plus experiment knobs: `experiment_type`, `render_mode`,
  `server_delay_ms`, `client_delay_ms`, `json_ld`, and an optional `slug`
  override.

### Experiment rendering

- `/post/[slug]` uses `src/layouts/PostLayout.astro` to inspect the frontmatter
  and either render the Markdown body (SSR) or inject it with the lightweight
  module in `src/scripts/experiments.ts` (`js-only` / `mixed`).
- Hero images, optional videos, experiment metadata, and JSON-LD are rendered
  directly in the template so crawlers can see the toggles.
- Categories and tags resolve to `/category/[slug]` and `/tags/[tag]`; only
  `indexable: true` posts show up in the sitemap and RSS feed.

### Logging and Netlify

- `scripts/build-posts-index.mjs` emits a slug → experiment map which the
  Edge middleware imports.
- `netlify/edge-functions/logging.ts` runs on every request (`netlify.toml`
  wires it to `/*`). It assigns an `X-Request-Id`, optionally delays the
  response, and ships a JSON payload to the `LOGGING_ENDPOINT` with request
  headers, bot hints, and experiment metadata.
- Set `LOGGING_ENDPOINT`, `LOGGING_API_KEY`, and `SITE_ENV` inside the Netlify
  dashboard before deploying.

### BigQuery payload example

<!-- markdownlint-disable MD013 -->
```json
{
  "request_id": "9eaf41bb-edf0-4f7d-8d45-6623211b2ff2",
  "timestamp": "2024-05-15T17:12:54.383Z",
  "method": "GET",
  "path": "/post/js-only-observer",
  "query": "",
  "host": "example-site.netlify.app",
  "user_agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "referer": "https://www.google.com/",
  "x_forwarded_for": "203.0.113.10",
  "headers_json": "{...}",
  "is_bot": true,
  "bot_family": "googlebot",
  "experiment_type": "js_injected",
  "render_mode": "js-only",
  "server_delay_ms": 0,
  "response_status": 200,
  "site_env": "production",
  "slug": "js-only-observer"
}
```
<!-- markdownlint-enable MD013 -->

## Available scripts

- `npm run dev`: Generate the experiment index and start the Astro dev server.
- `npm run build`: Generate the index and create a production build.
- `npm run preview`: Preview the production build locally.
- `npm run generate:data`: Run only the experiment-index generator.

Deploy the project on Netlify, enable the Edge function, and the middleware plus
CMS are ready without additional configuration.
