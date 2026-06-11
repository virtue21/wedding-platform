'use client'
import { useEffect } from 'react'
import { track } from '@/lib/mixpanel'

export default function LandingTracking() {
  useEffect(() => {
    track('page_viewed', { page: 'landing' })
  }, [])
  return null
}
