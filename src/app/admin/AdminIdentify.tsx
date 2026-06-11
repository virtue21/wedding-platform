'use client'

import { useEffect } from 'react'
import { identify } from '@/lib/mixpanel'

export default function AdminIdentify({ userId }: { userId: string }) {
  useEffect(() => {
    identify(userId)
  }, [userId])
  return null
}
