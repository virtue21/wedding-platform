'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Lightbulb, X } from 'lucide-react'

type Props = {
  id: string
  icon: ReactNode
  title: string
  body: string
  tip?: string
}

function storageKey(id: string) {
  return `nemi_guide_dismissed_${id}`
}

export default function SectionGuide({ id, icon, title, body, tip }: Props) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(storageKey(id)) === '1') setDismissed(true)
  }, [id])

  if (dismissed) return null

  return (
    <div className="bg-rose-50 border border-rose-100 rounded-2xl px-5 py-4 flex gap-3 mb-6">
      <div className="flex-shrink-0 mt-0.5 text-rose-500">{icon}</div>
      <div className="text-sm flex-1 min-w-0">
        <p className="font-medium text-stone-700">{title}</p>
        <p className="text-stone-500 mt-0.5 leading-relaxed">{body}</p>
        {tip && (
          <p className="text-rose-600 mt-1.5 text-xs font-medium flex items-start gap-1">
            <Lightbulb size={13} className="shrink-0 mt-0.5" /> {tip}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(storageKey(id), '1')
          setDismissed(true)
        }}
        aria-label="Dismiss"
        className="shrink-0 p-1 text-rose-400 hover:text-rose-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  )
}
