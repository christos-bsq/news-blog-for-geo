interface SiteConfig {
	site: string
	author: string
	title: string
	description: string
	lang: string
	ogLocale: string
	shareMessage: string
	paginationSize: number
}

export const siteConfig: SiteConfig = {
	site: 'https://signal-north-daily.netlify.app',
	author: 'Signal North Team',
	title: 'Signal North Daily',
	description:
		'Signal North Daily publishes practical GEO/AEO posts so teams can see how bots digest newsroom-style pages.',
	lang: 'en-US',
	ogLocale: 'en_US',
	shareMessage: 'Share this GEO / AEO post',
	paginationSize: 6
}
