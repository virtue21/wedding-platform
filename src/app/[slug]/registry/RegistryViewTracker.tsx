'use client'

import { useEffect } from 'react'
import { track } from '@/lib/mixpanel'

export default function RegistryViewTracker({ weddingSlug }: { weddingSlug: string }) {
  useEffect(() => {
    track('registry_viewed', { wedding_slug: weddingSlug })
  }, [weddingSlug])
  return null
}
