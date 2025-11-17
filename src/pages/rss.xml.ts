import rss from '@astrojs/rss'
import { siteConfig } from '@/data/site.config'
import { getIndexablePosts, getPostSlug } from '@/utils'

export async function GET(context: any) {
	const posts = await getIndexablePosts()
	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: context.site,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.date,
			link: `post/${getPostSlug(post)}/`
		}))
	})
}
