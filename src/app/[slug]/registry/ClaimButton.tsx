'use client'

import { useState, useTransition } from 'react'
import { claimGift } from './actions'
import { track } from '@/lib/mixpanel'

type Props = {
  itemId: string
  itemName: string
  /** Passed from URL param after RSVP — skips the name/phone prompt */
  sessionGuestId: string | null
  sessionGuestName: string | null
  sessionGuestPhone: string | null
  isClaimed: boolean
  onClaimed?: () => void
}

export default function ClaimButton({
  itemId,
  itemName,
  sessionGuestId,
  sessionGuestName,
  sessionGuestPhone,
  isClaimed,
  onClaimed,
}: Props) {
  const [state, setState] = useState<'idle' | 'prompt' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [isPending, startTransition] = useTransition()

  if (isClaimed) {
    return (
      <span className="text-xs text-stone-400 font-medium">Fully Claimed</span>
    )
  }

  function handleClick() {
    if (sessionGuestId) {
      // Session guest — claim immediately
      startTransition(async () => {
        const result = await claimGift(itemId, sessionGuestName!, sessionGuestPhone, sessionGuestId)
        if (result.ok) { setState('done'); onClaimed?.(); track('gift_claimed', { item_name: itemName, fulfillment_type: 'physical' }) }
        else { setErrorMsg(result.error); setState('error') }
      })
    } else {
      setState('prompt')
    }
  }

  function handlePromptSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    startTransition(async () => {
      const result = await claimGift(itemId, name.trim(), phone.trim() || null, null)
      if (result.ok) { setState('done'); onClaimed?.(); track('gift_claimed', { item_name: itemName, fulfillment_type: 'physical' }) }
      else { setErrorMsg(result.error); setState('error') }
    })
  }

  if (state === 'done') {
    return <span className="text-xs text-green-600 font-medium">🎁 Gift claimed!</span>
  }

  if (state === 'error') {
    return <span className="text-xs text-red-600 font-medium">{errorMsg}</span>
  }

  if (state === 'prompt') {
    return (
      <form onSubmit={handlePromptSubmit} className="space-y-2 pt-1">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-1.5 bg-stone-800 hover:bg-stone-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? 'Claiming…' : 'Confirm claim'}
          </button>
          <button
            type="button"
            onClick={() => setState('idle')}
            className="px-3 py-1.5 border border-stone-200 text-xs text-stone-500 rounded-lg hover:bg-stone-50"
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs font-medium text-stone-700 hover:text-stone-900 underline underline-offset-2 transition-colors disabled:opacity-50"
    >
      {isPending ? 'Claiming…' : "I'll get this 🎁"}
    </button>
  )
}
