'use client'

import { useTransition } from 'react'
import { setSubscriptionStatus, toggleRsvp } from './actions'

type Sub = {
  id: string
  status: string
  weddingId: string
}

export function SubscriptionActions({ sub }: { sub: Sub }) {
  const [pending, start] = useTransition()

  if (sub.status === 'cancelled') {
    return <span className="text-stone-500 text-xs">Cancelled — no actions available</span>
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {sub.status === 'active' && (
        <button
          disabled={pending}
          onClick={() => start(() => setSubscriptionStatus(sub.id, 'paused', sub.weddingId))}
          className="px-4 py-2 text-sm bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-xl transition-colors disabled:opacity-50"
        >
          ⏸ Pause subscription
        </button>
      )}
      {sub.status === 'paused' && (
        <button
          disabled={pending}
          onClick={() => start(() => setSubscriptionStatus(sub.id, 'active', sub.weddingId))}
          className="px-4 py-2 text-sm bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl transition-colors disabled:opacity-50"
        >
          ▶ Resume subscription
        </button>
      )}
      {(sub.status === 'active' || sub.status === 'paused') && (
        <button
          disabled={pending}
          onClick={() => {
            if (!confirm('Cancel this subscription permanently? This cannot be undone.')) return
            start(() => setSubscriptionStatus(sub.id, 'cancelled', sub.weddingId))
          }}
          className="px-4 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors disabled:opacity-50"
        >
          ✕ Cancel subscription
        </button>
      )}
    </div>
  )
}

export function RsvpToggle({
  weddingId,
  enabled,
  subActive,
}: {
  weddingId: string
  enabled: boolean
  subActive: boolean
}) {
  const [pending, start] = useTransition()

  // Guests can only RSVP when the couple's switch is on AND they've paid.
  // Show the effective state, not just the couple's switch.
  const effectivelyOpen = enabled && subActive

  let caption: string
  if (effectivelyOpen) caption = 'Guests can currently RSVP'
  else if (!subActive && enabled) caption = 'Blocked — no active subscription'
  else if (!subActive) caption = 'Closed, and blocked by no active subscription'
  else caption = 'RSVP is closed for guests'

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white text-sm font-medium">RSVP</p>
        <p className={`text-xs mt-0.5 ${!subActive ? 'text-amber-400' : 'text-stone-500'}`}>
          {caption}
        </p>
      </div>
      <button
        disabled={pending || !subActive}
        title={!subActive ? 'Requires an active subscription' : undefined}
        onClick={() => start(() => toggleRsvp(weddingId, !enabled))}
        className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          effectivelyOpen ? 'bg-green-500' : 'bg-stone-700'
        }`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${effectivelyOpen ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}
