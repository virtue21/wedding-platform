'use client'

import { useState } from 'react'
import Toggle from '@/components/Toggle'
import { saveWishesVisibility } from './actions'

export default function WishesVisibility({
  weddingId,
  initialPublic,
}: {
  weddingId: string
  initialPublic: boolean
}) {
  const [isPublic, setIsPublic] = useState(initialPublic)
  const [saving, setSaving] = useState(false)

  async function toggle() {
    const next = !isPublic
    setSaving(true)
    setIsPublic(next)
    await saveWishesVisibility(weddingId, next)
    setSaving(false)
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-stone-800 text-sm font-medium">Wishes wall</p>
          <span className={`text-[11px] px-2 py-0.5 rounded-full ${
            isPublic ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-500'
          }`}>
            {isPublic ? 'Shared' : 'Private'}
          </span>
        </div>
        <p className="text-stone-400 text-xs mt-1 max-w-md">
          {isPublic
            ? 'Guests can read each other’s wishes on your page.'
            : 'Only you can read the wishes. Guests still leave them, but see just their own confirmation.'}
        </p>
      </div>
      <Toggle
        checked={isPublic}
        onChange={toggle}
        disabled={saving}
        label={isPublic ? 'Make wishes private' : 'Share wishes with guests'}
      />
    </div>
  )
}
