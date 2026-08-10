import type { MetadataRoute } from 'next'

/**
 * Only the production site should be indexed. UAT and preview
 * deployments return a blanket disallow so test weddings and
 * half-finished features never show up in search results.
 *
 * On production: guest invite pages (/<slug>) and marketing pages
 * (/about, /pricing, …) are syntactically identical single-segment root
 * paths — no robots.txt pattern can tell them apart. So this fails
 * closed: "Disallow: /" blocks everything, "Allow: /$" carves out
 * exactly the homepage. Adding a new real static page means adding its
 * own Allow rule here (and a matching entry in sitemap.ts) — deliberate
 * exposure, not an accidental crawl of someone's wedding page.
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
