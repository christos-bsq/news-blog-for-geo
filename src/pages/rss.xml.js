import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/siteConfig";
import { getIndexable, getPostSlug } from "@/lib/postHelpers";

export async function GET() {
  const posts = await getCollection("posts");
  const visible = getIndexable(posts);

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: "https://signal-north-daily.netlify.app",
    items: visible.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/post/${getPostSlug(post)}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}
