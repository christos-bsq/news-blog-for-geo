---
title: "About This Research Lab"
description: "How we design controlled GEO / AEO experiments without turning the site into a sterile test bed."
date: 2024-05-05T10:00:00.000Z
updated: 2024-05-05T10:00:00.000Z
slug: about-this-research
category: Briefings
tags:
  - about
  - lab
  - methodology
indexable: true
experiment_type: baseline
render_mode: ssr
server_delay_ms: 0
client_delay_ms: 0
image: /uploads/about-lab.jpg
image_alt: Sketchbook describing experiment ideas
video_url: null
json_ld:
  "@context": https://schema.org
  "@type": Article
  headline: About This Research Lab
  datePublished: 2024-05-05T10:00:00.000Z
---
Signal North Daily borrows a real newsroom cadence so we can test
answer-engine behavior without raising flags. Each article has:

- A **narrative arc** that reads like a feature or short news brief.
- **Experiment switches** in frontmatter that toggle schema, rendering, or
  latency behaviors.
- **Logging hooks** so every request is tied to an experiment slug and request
  ID.

By keeping those knobs out of the URL, we can compare crawler behavior
apples-to-apples. The CMS exposes all of the fields editors need, and the Edge
middleware keeps the logging + delay logic in one place.
