import type { MetadataRoute } from 'next'

const baseUrl = 'https://nemiplanner.xyz'

/**
 * Public, unauthenticated pages only. Guest invite pages (/<slug>) are
 * dynamic, per-couple, and often private — blocked in robots.ts instead.
 *
 * If /about, /pricing etc. ship later: only list them here if they're
 * reachable without signing in. A crawler can't authenticate, so an
 * auth-gated page in the sitemap just sends bots into a login wall —
 * it gets no SEO benefit and wastes crawl budget. Gated pages need no
 * entry here and no Allow rule in robots.ts; the default Disallow
 * already covers them, same as guest slugs.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
