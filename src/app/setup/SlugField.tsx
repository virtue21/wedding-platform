'use client'

import { useState } from 'react'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'

export default function SlugField({ defaultValue }: { defaultValue: string }) {
  const [slug, setSlug] = useState(defaultValue)

  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">
        Wedding URL <span className="text-red-500">*</span>
      </label>
      <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-stone-400">
        <span className="px-3 py-2 bg-stone-50 text-stone-400 text-sm border-r border-stone-300 whitespace-nowrap select-none">
          {BASE_URL}/
        </span>
        <input
          name="slug"
          type="text"
          required
          value={slug}
          onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          placeholder="ada-and-chike"
          className="flex-1 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none bg-white"
        />
      </div>
      <p className="mt-1 text-xs text-stone-400">
        Only lowercase letters, numbers, and hyphens. This is the link you&apos;ll share with guests.
      </p>
    </div>
  )
}
