---
title: "JSON-LD vs No JSON-LD for News Briefs"
description: "A/B crawl experiment on whether structured data still matters for compact newsroom updates."
date: 2024-05-01T09:00:00.000Z
updated: 2024-05-02T13:00:00.000Z
slug: jsonld-vs-no-jsonld
category: Experiments
tags:
  - jsonld
  - serp
  - schema
indexable: true
experiment_type: jsonld
render_mode: ssr
server_delay_ms: 0
client_delay_ms: 0
image: /uploads/jsonld-lab.jpg
image_alt: Analysts reviewing schema coverage
video_url: https://www.youtube.com/embed/dQw4w9WgXcQ
json_ld:
  "@context": https://schema.org
  "@type": NewsArticle
  headline: JSON-LD vs No JSON-LD for News Briefs
  description: A/B crawl experiment on whether structured data still matters for compact newsroom updates.
  datePublished: 2024-05-01T09:00:00.000Z
  dateModified: 2024-05-02T13:00:00.000Z
  mainEntityOfPage:
    "@type": WebPage
    "@id": https://geo-aeo-experiments.netlify.app/post/jsonld-vs-no-jsonld
---
The baseline for this run mirrors a normal newsroom brief. Each variant uses
the exact same copy, hero image, and site chrome. The only difference is the
presence or absence of JSON-LD.

Key checkpoints:

- Googlebot news crawler hits both versions in under 90 seconds after pinging
  the PubSub hub.
- Bingbot takes roughly 12 minutes to revisit the URL even when submitting via
  IndexNow.
- Perplexity's fetcher spotted the JSON-LD version first, yet the generated
  answer cited the canonical version that lacked schema.

During the first 24 hours, both versions ranked in Top Stories, but the JSON-LD
variant earned richer answer cards in ChatGPT Search and Brave Summarizer. The
copy you are reading right now matches what we ship to human readers—no hidden
paragraphs or bait.

The takeaway so far: JSON-LD is not a silver bullet, but removing it visibly
changes downstream summaries. Keeping schema current still helps align how bots
explain you to users.
