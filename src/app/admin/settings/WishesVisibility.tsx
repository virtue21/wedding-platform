'use client'

import { useState } from 'react'
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
      <button
        onClick={toggle}
        disabled={saving}
        aria-label={isPublic ? 'Make wishes private' : 'Share wishes with guests'}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${
          isPublic ? 'bg-emerald-500' : 'bg-stone-200'
        }`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}
