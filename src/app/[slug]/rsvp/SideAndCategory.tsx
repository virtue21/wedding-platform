'use client'

import { useState } from 'react'
import type { RelationshipCategory, RelationshipSubcategory } from '@/lib/supabase/database.types'

type Props = {
  brideCategories: RelationshipCategory[]
  groomCategories: RelationshipCategory[]
  subcategories: RelationshipSubcategory[]
}

export default function SideAndCategory({ brideCategories, groomCategories, subcategories }: Props) {
  const [side, setSide]           = useState<'bride' | 'groom' | 'both' | ''>('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')

  const categories =
    side === 'bride' ? brideCategories
    : side === 'groom' ? groomCategories
    : side === 'both'
      ? [...brideCategories, ...groomCategories].filter(
          (c, i, arr) => arr.findIndex(x => x.label === c.label) === i
        )
      : []

  // Subcategories for the selected category
  const availableSubs = categoryId
    ? subcategories.filter(s => s.category_id === categoryId)
    : []

  function handleSideChange(s: 'bride' | 'groom' | 'both') {
    setSide(s)
    setCategoryId('')
    setSubcategoryId('')
  }

  function handleCategoryChange(id: string) {
    setCategoryId(id)
    setSubcategoryId('')
  }

  return (
    <div className="space-y-4">

      {/* Who do you know */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          Who do you know? <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['bride', 'groom', 'both'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => handleSideChange(s)}
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

      {/* Category */}
      {side && (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            How do you know them? <span className="text-red-500">*</span>
          </label>
          <select
            name="category_id"
            required
            value={categoryId}
            onChange={e => handleCategoryChange(e.target.value)}
            className="input"
          >
            <option value="" disabled>Select a category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Subcategory — only shown when the selected category has subcategories */}
      {categoryId && availableSubs.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            More specifically? <span className="text-red-500">*</span>
          </label>
          <select
            name="subcategory_id"
            required
            value={subcategoryId}
            onChange={e => setSubcategoryId(e.target.value)}
            className="input"
          >
            <option value="" disabled>Select a sub-category</option>
            {availableSubs.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
