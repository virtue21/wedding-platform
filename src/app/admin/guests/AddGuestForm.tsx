'use client'

import { useState } from 'react'
import { addGuest } from './actions'
import type { RelationshipCategory } from '@/lib/supabase/database.types'
import { track } from '@/lib/mixpanel'

type Props = {
  categories: Pick<RelationshipCategory, 'id' | 'label' | 'side'>[]
}

export default function AddGuestForm({ categories }: Props) {
  const [open, setOpen] = useState(false)
  const [side, setSide] = useState<'bride' | 'groom' | 'both'>('bride')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const visibleCategories =
    side === 'both' ? categories : categories.filter(c => c.side === side)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const result = await addGuest(formData)
    setPending(false)
    if (result.ok) {
      track('guest_added_manually')
      setOpen(false)
    } else {
      setError(result.error ?? 'Something went wrong.')
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(null) }}
        className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors"
      >
        + Add guest
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-7 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-xl text-stone-800 mb-1">Add a guest</h3>
            <p className="text-sm text-stone-400 mb-6">
              For guests you&apos;re confirming yourself — they won&apos;t need to RSVP.
            </p>

            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
                  Full name <span className="text-rose-400">*</span>
                </label>
                <input name="full_name" type="text" required placeholder="Emeka Obi" className="input" />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
                  Phone number <span className="text-rose-400">*</span>
                </label>
                <input name="phone" type="tel" required placeholder="+2348000000000" className="input" />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
                  Email address
                </label>
                <input name="email" type="email" placeholder="Optional" className="input" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
                    Side <span className="text-rose-400">*</span>
                  </label>
                  <select
                    name="side"
                    value={side}
                    onChange={e => setSide(e.target.value as 'bride' | 'groom' | 'both')}
                    className="input"
                  >
                    <option value="bride">Bride&apos;s side</option>
                    <option value="groom">Groom&apos;s side</option>
                    <option value="both">Knows both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <select name="category_id" required className="input" defaultValue="">
                    <option value="" disabled>Select…</option>
                    {visibleCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 border border-rose-100 text-stone-500 rounded-xl text-sm hover:bg-rose-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {pending ? 'Adding…' : 'Add guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
