'use client'

import { useState } from 'react'
import { saveRsvpSettings } from './actions'

type Props = {
  weddingId: string
  initialEnabled: boolean
  initialLimit: number | null
  currentCount: number
}

export default function RsvpSettingsClient({ weddingId, initialEnabled, initialLimit, currentCount }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [limit, setLimit] = useState<number | null>(initialLimit)
  const [saving, setSaving] = useState(false)
  const [showPlansModal, setShowPlansModal] = useState(false)

  async function handleEnable() {
    setSaving(true)
    await saveRsvpSettings(weddingId, true, limit)
    setEnabled(true)
    setShowPlansModal(false)
    setSaving(false)
  }

  async function handleDisable() {
    setSaving(true)
    await saveRsvpSettings(weddingId, false, limit)
    setEnabled(false)
    setSaving(false)
  }

  async function handleSaveLimit() {
    setSaving(true)
    await saveRsvpSettings(weddingId, enabled, limit)
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* RSVP Toggle card */}
      <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-medium text-stone-800">RSVP</h2>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                enabled
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : 'bg-stone-100 text-stone-400 border border-stone-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-emerald-400' : 'bg-stone-300'}`} />
                {enabled ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-stone-400">Allow guests to confirm their attendance via your wedding page.</p>
            {enabled && currentCount > 0 && (
              <p className="text-xs text-emerald-600 mt-2">{currentCount} guests confirmed so far</p>
            )}
            {!enabled && (
              <p className="text-xs text-amber-500 mt-2">RSVP is disabled. Guests can only view the registry.</p>
            )}
          </div>
          {/* Toggle switch */}
          <button
            onClick={() => enabled ? handleDisable() : setShowPlansModal(true)}
            disabled={saving}
            className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${enabled ? 'bg-rose-500' : 'bg-stone-200'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* RSVP Limit */}
        {enabled && (
          <div className="mt-5 pt-5 border-t border-rose-50">
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">RSVP Limit (optional)</label>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                min={1}
                value={limit ?? ''}
                onChange={e => setLimit(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="No limit"
                className="w-32 px-3 py-2 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <button
                onClick={handleSaveLimit}
                disabled={saving}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
            <p className="text-xs text-stone-400 mt-1.5">
              {limit
                ? `RSVP will close after ${limit} confirmations. Currently ${currentCount}/${limit} used.`
                : 'Guests can RSVP without limit.'}
            </p>
          </div>
        )}
      </div>

      {/* Plans modal */}
      {showPlansModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <p className="text-2xl mb-3 text-center">💳</p>
            <h3 className="font-serif text-xl text-stone-800 text-center mb-2">Activate RSVP</h3>
            <p className="text-sm text-stone-400 text-center mb-1">RSVP will require a paid plan in the future.</p>
            <p className="text-xs text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2 text-center mb-5">
              🎉 You&apos;re on the free beta — RSVP is free to use right now.
            </p>
            <div className="space-y-2">
              <button
                onClick={handleEnable}
                disabled={saving}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {saving ? 'Enabling…' : 'Enable RSVP (Free Beta)'}
              </button>
              <button
                onClick={() => setShowPlansModal(false)}
                className="w-full py-3 border border-stone-200 text-stone-500 font-medium rounded-xl hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
