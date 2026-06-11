'use client'

import { useEffect } from 'react'
import { track } from '@/lib/mixpanel'

export default function RsvpCompletedTracker({ weddingSlug }: { weddingSlug: string }) {
  useEffect(() => {
    track('rsvp_completed', { wedding_slug: weddingSlug })
  }, [weddingSlug])
  return null
}
