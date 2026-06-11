'use client'

import { useEffect } from 'react'
import { track } from '@/lib/mixpanel'

export default function SetupTracker({ saved }: { saved: boolean }) {
  useEffect(() => {
    if (saved) {
      track('wedding_setup_completed')
    }
  }, [saved])
  return null
}
