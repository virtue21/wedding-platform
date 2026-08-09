'use client'

import { useState } from 'react'
import { saveRegistryPreferences, getSuggestions, acceptSuggestions } from './assistant-actions'
import { formatPriceRange, type Suggestion } from '@/lib/registryMatcher'
import { track } from '@/lib/mixpanel'

type Prefs = {
  cooking_frequency: string | null
  household_size: string | null
  budget_band: string | null
  owned_categories: string[]
  delivery_state: string | null
}

type Props = {
  categories: string[]
  initialPrefs: Prefs | null
  atRegistryCap?: boolean
}

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT — Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
]

export default function RegistryAssistant({ categories, initialPrefs, atRegistryCap }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'prefs' | 'review'>('prefs')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const [added, setAdded] = useState<number | null>(null)

  const kept = suggestions.filter(s => !removed.has(s.catalogId))

  async function handleSubmitPrefs(formData: FormData) {
    setPending(true)
    setError(null)
    const saved = await saveRegistryPreferences(formData)
    if (!saved.ok) {
      setError(saved.error ?? 'Something went wrong.')
      setPending(false)
      return
    }
    const result = await getSuggestions()
    setPending(false)
    if (result.error) { setError(result.error); return }
    if (result.suggestions.length === 0) {
      setError('No new suggestions right now — you may already have everything we recommend.')
      return
    }
    track('registry_suggestions_generated')
    setSuggestions(result.suggestions)
    setRemoved(new Set())
    setStep('review')
  }

  async function handleAccept() {
    setPending(true)
    setError(null)
    const result = await acceptSuggestions(
      kept.map(s => ({
        itemName: s.itemName,
        category: s.category,
        priceLow: s.priceLow,
        priceHigh: s.priceHigh,
        url: s.url,
      }))
    )
    setPending(false)
    if (!result.ok) { setError(result.error ?? 'Something went wrong.'); return }
    track('registry_suggestions_accepted')
    setAdded(result.added)
    setStep('prefs')
    setSuggestions([])
    setTimeout(() => { setOpen(false); setAdded(null) }, 2200)
  }

  const field = 'w-full px-3.5 py-2.5 border border-rose-100 rounded-xl text-sm text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-200'

  return (
    <>
      <button
        onClick={() => { setOpen(true); setStep('prefs'); setError(null); setAdded(null) }}
        disabled={atRegistryCap}
        title={atRegistryCap ? 'Upgrade your plan to add more items' : undefined}
        className="flex items-center gap-2 px-4 py-2.5 border border-rose-200 hover:border-rose-300 text-rose-500 text-sm font-medium rounded-xl transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ✨ Get suggestions
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* ── Step 1: preferences ── */}
            {step === 'prefs' && (
              <form action={handleSubmitPrefs} className="p-7 space-y-4">
                <div>
                  <h3 className="font-serif text-xl text-stone-800">Registry suggestions</h3>
                  <p className="text-sm text-stone-400 mt-1">
                    A few questions so we suggest things that actually suit you. Nothing is added until you approve it.
                  </p>
                </div>

                {added !== null && (
                  <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                    ✓ Added {added} {added === 1 ? 'item' : 'items'} to your registry.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
                      Cooking frequency
                    </label>
                    <select name="cooking_frequency" defaultValue={initialPrefs?.cooking_frequency ?? 'sometimes'} className={field}>
                      <option value="rarely">Rarely</option>
                      <option value="sometimes">Sometimes</option>
                      <option value="often">Often — most days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
                      Cooking for
                    </label>
                    <select name="household_size" defaultValue={initialPrefs?.household_size ?? '1-2'} className={field}>
                      <option value="1-2">1–2 people</option>
                      <option value="3-4">3–4 people</option>
                      <option value="5+">5 or more</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
                    Registry budget
                  </label>
                  <select name="budget_band" defaultValue={initialPrefs?.budget_band ?? 'standard'} className={field}>
                    <option value="lean">Lean — keep gifts affordable for guests</option>
                    <option value="standard">Standard — a mix</option>
                    <option value="generous">Generous — premium items</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
                    Delivery state
                  </label>
                  <select name="delivery_state" defaultValue={initialPrefs?.delivery_state ?? ''} className={field}>
                    <option value="">Not specified</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
                    Already own — we&apos;ll skip these
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {categories.map(c => (
                      <label key={c} className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
                        <input
                          type="checkbox"
                          name="owned_categories"
                          value={c}
                          defaultChecked={initialPrefs?.owned_categories?.includes(c)}
                          className="rounded"
                        />
                        <span className="truncate">{c}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{error}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-rose-100 text-stone-500 rounded-xl text-sm hover:bg-rose-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={pending} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                    {pending ? 'Finding items…' : 'See suggestions'}
                  </button>
                </div>
              </form>
            )}

            {/* ── Step 2: review before anything is added ── */}
            {step === 'review' && (
              <div className="p-7 space-y-4">
                <div>
                  <h3 className="font-serif text-xl text-stone-800">Review suggestions</h3>
                  <p className="text-sm text-stone-400 mt-1">
                    Remove anything you don&apos;t want. Only what&apos;s left gets added to your registry.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {suggestions.map(s => {
                    const isRemoved = removed.has(s.catalogId)
                    return (
                      <div
                        key={s.catalogId}
                        className={`border rounded-2xl p-4 transition-opacity ${isRemoved ? 'opacity-40 border-stone-100' : 'border-rose-50 bg-white shadow-sm'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[11px] text-stone-400 uppercase tracking-wide">{s.category}</p>
                            <p className="text-sm font-medium text-stone-800 mt-0.5">{s.itemName}</p>
                            <p className="text-sm font-semibold text-rose-500 mt-1">
                              {formatPriceRange(s.priceLow, s.priceHigh)}
                            </p>
                            <p className="text-xs text-stone-400 mt-1">{s.reason}</p>
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block text-xs text-rose-400 hover:text-rose-600 underline underline-offset-2 mt-1.5"
                            >
                              {s.isSearchLink ? 'Search for this item ↗' : 'View item ↗'}
                            </a>
                          </div>
                          <button
                            onClick={() => setRemoved(prev => {
                              const next = new Set(prev)
                              if (next.has(s.catalogId)) next.delete(s.catalogId)
                              else next.add(s.catalogId)
                              return next
                            })}
                            className="shrink-0 text-xs px-2.5 py-1.5 border border-stone-200 rounded-lg text-stone-500 hover:border-stone-300 transition-colors"
                          >
                            {isRemoved ? 'Keep' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {error && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{error}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setStep('prefs')} className="flex-1 py-2.5 border border-rose-100 text-stone-500 rounded-xl text-sm hover:bg-rose-50 transition-colors">
                    ← Back
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={pending || kept.length === 0}
                    className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {pending ? 'Adding…' : `Add ${kept.length} ${kept.length === 1 ? 'item' : 'items'}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
