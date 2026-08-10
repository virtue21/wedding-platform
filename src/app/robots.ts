import type { MetadataRoute } from 'next'

/**
 * Only the production site should be indexed. UAT and preview
 * deployments return a blanket disallow so test weddings and
 * half-finished features never show up in search results.
 *
 * On production: guest invite pages (/<slug>) and any future static page
 * are syntactically identical single-segment root paths — no robots.txt
 * pattern can tell them apart. So this fails closed: "Disallow: /" blocks
 * everything, "Allow: /$" carves out exactly the homepage.
 *
 * A new static page only needs its own Allow rule here if it's reachable
 * without signing in — an auth-gated page (e.g. if /about or /pricing end
 * up behind login) is already unreachable to crawlers and needs nothing
 * added; giving it an Allow rule would just point bots at a login wall.
 */
export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === 'production'

  if (!isProduction) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: [
      { userAgent: '*', allow: '/$', disallow: '/' },
    ],
    sitemap: 'https://nemiplanner.xyz/sitemap.xml',
  }
}
