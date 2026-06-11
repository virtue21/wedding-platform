'use client'

import { useEffect } from 'react'
import { track } from '@/lib/mixpanel'

export default function RsvpPageTracker({ weddingSlug }: { weddingSlug: string }) {
  useEffect(() => {
    track('rsvp_page_viewed', { wedding_slug: weddingSlug })
  }, [weddingSlug])
  return null
}
