'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

export default function ShareInviteButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors"
      >
        Share your invite link
      </button>

      <div
        role="status"
        className="fixed left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 bg-stone-800 text-white text-sm rounded-xl shadow-lg transition-all"
        style={{
          bottom: copied ? 24 : -60,
          opacity: copied ? 1 : 0,
          pointerEvents: 'none',
        }}
      >
        <Check size={15} className="text-emerald-400" />
        Invite link copied
      </div>
    </div>
  )
}
