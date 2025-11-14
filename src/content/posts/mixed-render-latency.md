---
title: "Mixed Render Latency Study"
description: "Combining SSR intros with a delayed JS payload to map how bots stitch together partially rendered pages."
date: 2024-05-14T15:00:00.000Z
updated: 2024-05-15T10:00:00.000Z
slug: mixed-render-latency
category: Experiments
tags:
  - latency
  - rendering
  - bots
indexable: true
experiment_type: mixed
render_mode: mixed
server_delay_ms: 600
client_delay_ms: 1200
image: /uploads/mixed-render.jpg
image_alt: Render waterfall sketch
video_url: null
json_ld:
  "@context": https://schema.org
  "@type": NewsArticle
  headline: Mixed Render Latency Study
  datePublished: 2024-05-14T15:00:00.000Z
---
This piece starts with a short SSR intro so human visitors instantly understand
what is happening. Everything after the intro—including the detailed tables
and trendlines—appears via client-side hydration.

The edge middleware purposely adds ~600ms before handing the request to Astro.
That profile makes the total time-to-first-byte look sluggish even though
Netlify's CDN responds from the edge.

For bots, we learned:

- Googlebot still renders the delayed payload, but it sometimes misses the
  appended tables during heavy crawl windows.
- Bingbot seems to time out at roughly 1.7 seconds, so most Bing caches only
  include the intro paragraphs.
- Brave Summarizer reads the SSR intro and stops, which is ideal for comparing
  "mixed" vs "jsonld" answers.

This mixed pattern gives us a reliable toggle for when we need to analyze
partial SSR vs full SSR influence without creating a separate set of URLs.
