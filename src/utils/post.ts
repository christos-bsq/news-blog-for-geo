import type { CollectionEntry } from 'astro:content'
import { getCollection } from 'astro:content'
import { CATEGORIES } from '@/data/categories'
import { slugify } from './slugify'

type PostEntry = CollectionEntry<'posts'>

const sortPosts = (nodes: PostEntry[]) =>
	[...nodes].sort((a, b) => b.data.date.getTime() - a.data.date.getTime())

const isPublished = (post: PostEntry) => post.data.draft !== true

const categoryOrder = (value: string) => {
	const idx = CATEGORIES.indexOf(value as (typeof CATEGORIES)[number])
	return idx === -1 ? Number.MAX_SAFE_INTEGER : idx
}

export const getPostSlug = (post: PostEntry) => {
	const rawSlug = (post.data as Record<string, unknown>).slug
	if (typeof rawSlug === 'string' && rawSlug.trim()) {
		return slugify(rawSlug)
	}
	return post.slug
}

export const getAllPosts = async () => {
	const posts = await getCollection('posts')
	return sortPosts(posts)
}

export const getPosts = async (max?: number) => {
	const posts = sortPosts((await getCollection('posts')).filter(isPublished))
	return typeof max === 'number' ? posts.slice(0, max) : posts
}

export const getIndexablePosts = async () => {
	const posts = await getAllPosts()
	return posts.filter((post) => post.data.indexable !== false && isPublished(post))
}

export const getCategories = async () => {
	const posts = await getPosts()
	const categories = new Set<string>()
	for (const post of posts) {
		categories.add(post.data.category)
	}
	return Array.from(categories).sort(
		(a, b) => categoryOrder(a) - categoryOrder(b) || a.localeCompare(b)
	)
}

export const getTags = async () => {
	const posts = await getPosts()
	const tags = new Set<string>()
	for (const post of posts) {
		for (const tag of post.data.tags ?? []) {
			if (!tag) continue
			tags.add(tag.toLowerCase())
		}
	}
	return Array.from(tags).sort()
}

export const getPostsByCategory = async (categorySlug: string) => {
	const normalized = slugify(categorySlug)
	const posts = await getPosts()
	return posts.filter((post) => slugify(post.data.category) === normalized)
}

export const getPostsByTag = async (tagSlug: string) => {
	const normalized = tagSlug.toLowerCase()
	const posts = await getPosts()
	return posts.filter((post) =>
		(post.data.tags ?? []).some((tag) => tag.toLowerCase() === normalized)
	)
}

export const getRelatedPosts = async (post: PostEntry, max = 3) => {
	const posts = await getPosts()
	const targetTags = post.data.tags.map((tag) => tag.toLowerCase())
	return posts
		.filter((candidate) => candidate.slug !== post.slug)
		.filter((candidate) =>
			candidate.data.tags.some((tag) => targetTags.includes(tag.toLowerCase()))
		)
		.slice(0, max)
}
