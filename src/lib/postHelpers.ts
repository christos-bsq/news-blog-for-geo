import type { CollectionEntry } from "astro:content";
import { slugify } from "@/utils/slugify";

type Post = CollectionEntry<"posts">;

export function sortPosts(posts: Post[]) {
  return [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function getIndexable(posts: Post[]) {
  return posts.filter((post) => post.data.indexable !== false);
}

export function getAllCategories(posts: Post[]) {
  const map = new Map<string, { label: string; posts: Post[] }>();
  for (const post of posts) {
    const label = post.data.category;
    if (!label) continue;
    const key = slugify(label);
    const current = map.get(key) ?? { label, posts: [] };
    current.posts.push(post);
    map.set(key, current);
  }
  return map;
}

export function getAllTags(posts: Post[]) {
  const map = new Map<string, { label: string; posts: Post[] }>();
  for (const post of posts) {
    for (const tag of post.data.tags ?? []) {
      const key = slugify(tag);
      const current = map.get(key) ?? { label: tag, posts: [] };
      current.posts.push(post);
      map.set(key, current);
    }
  }
  return map;
}

export function getPostSlug(post: Post) {
  const dataSlug = (post.data as Record<string, unknown>).slug;
  if (typeof dataSlug === 'string' && dataSlug.trim()) {
    return slugify(dataSlug);
  }
  return post.slug;
}
