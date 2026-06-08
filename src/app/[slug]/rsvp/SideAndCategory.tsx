'use client'

import { useState } from 'react'
import type { RelationshipCategory } from '@/lib/supabase/database.types'

type Props = {
  brideCategories: RelationshipCategory[]
  groomCategories: RelationshipCategory[]
}

export default function SideAndCategory({ brideCategories, groomCategories }: Props) {
  const [side, setSide] = useState<'bride' | 'groom' | 'both' | ''>('')

  const categories =
    side === 'bride' ? brideCategories
    : side === 'groom' ? groomCategories
    : side === 'both'
      ? [...brideCategories, ...groomCategories].filter(
          (c, i, arr) => arr.findIndex(x => x.label === c.label) === i
        )
      : []

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Who do you know? <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['bride', 'groom', 'both'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => { setSide(s) }}
              className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors ${
                side === s
                  ? 'bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-200'
                  : 'border-rose-100 text-stone-500 hover:border-rose-200 bg-white'
              }`}
            >
              {s === 'bride' ? 'The Bride' : s === 'groom' ? 'The Groom' : 'Both'}
            </button>
          ))}
        </div>
        <input type="hidden" name="side" value={side} required />
      </div>

      {side && (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            How do you know them? <span className="text-red-500">*</span>
          </label>
          <select
            name="category_id"
            required
            defaultValue=""
            className="input"
          >
            <option value="" disabled>Select a category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
