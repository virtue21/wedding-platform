import type { MetadataRoute } from 'next'

/**
 * Only the production site should be indexed. UAT and preview
 * deployments return a blanket disallow so test weddings and
 * half-finished features never show up in search results.
 */
export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === 'production'

  if (!isProduction) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/superadmin/', '/setup', '/auth/', '/api/'] },
    ],
    sitemap: 'https://nemiplanner.xyz/sitemap.xml',
  }
}
