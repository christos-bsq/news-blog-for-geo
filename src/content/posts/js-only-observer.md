---
title: "JS-Only Observer: What Happens When Bots Refuse to Render"
description: "We ship an empty SSR shell and inject the entire story from a script to watch crawler fallbacks."
date: 2024-05-10T12:00:00.000Z
updated: 2024-05-11T08:30:00.000Z
slug: js-only-observer
category: Rendering
tags:
  - geo
  - crawling
  - javascript
indexable: true
experiment_type: js_injected
render_mode: js-only
server_delay_ms: 0
client_delay_ms: 750
image: /uploads/js-only.jpg
image_alt: Terminal feed showing JS hydration
video_url: null
json_ld:
  "@context": https://schema.org
  "@type": NewsArticle
  headline: "JS-Only Observer: What Happens When Bots Refuse to Render"
  datePublished: 2024-05-10T12:00:00.000Z
---
We intentionally hide the actual copy from the initial HTML response. Instead,
the article renders via JavaScript roughly three quarters of a second after
load. That delay is short enough for modern browsers, yet it is long enough for
bots that only snapshot the HTML to miss everything.

So far we observed the following:

1. **Googlebot Smartphone** still retrieves the full body because it executes
   JS, but the coverage report flags a "soft 404" for a tiny subset of hits. We
   suspect this is the rendering backlog showing through.
2. **You.com** and **DuckDuckGo's Instant Answer crawler** do not run the
   script. Both summarize the placeholder text verbatim, meaning their answer
   cards say "complete article is injected"—mission accomplished.
3. **Grok** (xAI) surprisingly executes the script, but it truncates the HTML
   after 20KB which means the final two sections vanish from its final answer.

The script also tags the injected container with data attributes so we can
correlate log records in BigQuery. That has already surfaced a few anonymous
bots that mimic Safari yet never execute client code.
