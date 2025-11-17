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
		'Signal North Daily publishes practical GEO/AEO experiments so teams can see how bots digest newsroom-style pages.',
	lang: 'en-US',
	ogLocale: 'en_US',
	shareMessage: 'Share this GEO / AEO experiment',
	paginationSize: 6
}
