import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { slugify } from "@/utils/slugify";
import { getPostSlug } from "@/utils";

export const GET: APIRoute = async ({ site }) => {
  const posts = await getCollection("posts");
  const origin = site?.toString() ?? "https://signal-north-daily.netlify.app";
  const indexablePosts = posts.filter((post) => post.data.indexable !== false);

  const categories = new Map<string, Date>();
  const tags = new Map<string, Date>();

  for (const post of indexablePosts) {
    categories.set(slugify(post.data.category), post.data.updated ?? post.data.date);
    for (const tag of post.data.tags ?? []) {
      tags.set(slugify(tag), post.data.updated ?? post.data.date);
    }
  }

  const urls = [
    createUrl(origin, "/", new Date()),
    ...indexablePosts.map((post) =>
      createUrl(origin, `/post/${getPostSlug(post)}`, post.data.updated ?? post.data.date)
    ),
    ...Array.from(categories.entries()).map(([slug, date]) => createUrl(origin, `/category/${slug}`, date)),
    ...Array.from(tags.entries()).map(([slug, date]) => createUrl(origin, `/tags/${slug}`, date)),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join(
    ""
  )}</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
};

function createUrl(origin: string, path: string, date: Date) {
  const loc = new URL(path, origin).href;
  const lastmod = date.toISOString();
  return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
}
