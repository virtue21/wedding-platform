import type { MetadataRoute } from 'next'

const baseUrl = 'https://nemiplanner.xyz'

/**
 * Public marketing/landing pages only. Guest invite pages (/<slug>) are
 * dynamic, per-couple, and often private (unpublished weddings, expired
 * trials) — they don't belong in a sitemap and are blocked in robots.ts.
 *
 * Add an entry here for each new static page as it ships (e.g. /about,
 * /pricing) — same list that needs a matching Allow rule in robots.ts.
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
