import { defineCollection, z } from "astro:content";
import { CATEGORIES } from "../data/categories";

const posts = defineCollection({
  type: "content",
  schema: () =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      category: z.enum(CATEGORIES),
      tags: z.array(z.string()).default([]),
      author: z.string().default("Signal North Team"),
      indexable: z.boolean().default(true),
      experiment_type: z
        .enum(["baseline", "jsonld", "js_injected", "mixed", "slow"])
        .default("baseline"),
      render_mode: z.enum(["ssr", "js-only", "mixed"]).default("ssr"),
      server_delay_ms: z.number().nonnegative().default(0),
      client_delay_ms: z.number().nonnegative().default(0),
      image: z.string().optional(),
      image_alt: z.string().optional(),
      video_url: z.string().optional().nullable(),
      json_ld: z.any().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { posts };
