'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard } from 'lucide-react'
import Toggle from '@/components/Toggle'
import { saveRsvpSettings } from './actions'

type Props = {
  weddingId: string
  initialEnabled: boolean
  initialLimit: number | null
  initialDeadline: string | null
  currentCount: number
  hasActivePlan?: boolean
  guestCap: number | null
}

export default function RsvpSettingsClient({ weddingId, initialEnabled, initialLimit, initialDeadline, currentCount, hasActivePlan, guestCap }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [limit, setLimit] = useState<number | null>(
    guestCap !== null && initialLimit !== null ? Math.min(initialLimit, guestCap) : initialLimit
  )
  const [deadline, setDeadline] = useState<string | null>(initialDeadline)
  const [saving, setSaving] = useState(false)
  const [showPlansModal, setShowPlansModal] = useState(false)
  const router = useRouter()

  async function handleEnable() {
    setSaving(true)
    await saveRsvpSettings(weddingId, true, limit, deadline)
    setEnabled(true)
    setShowPlansModal(false)
    setSaving(false)
  }

  async function handleDisable() {
    setSaving(true)
    await saveRsvpSettings(weddingId, false, limit, deadline)
    setEnabled(false)
    setSaving(false)
  }

  async function handleSaveLimit() {
    setSaving(true)
    await saveRsvpSettings(weddingId, enabled, limit, deadline)
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
          <Toggle
            checked={enabled}
            onChange={() => enabled ? handleDisable() : (hasActivePlan ? setShowPlansModal(true) : router.push('/admin/plans'))}
            disabled={saving}
            label={enabled ? 'Disable RSVP' : 'Enable RSVP'}
          />
        </div>

        {/* RSVP Limit + Deadline */}
        {enabled && (
          <div className="mt-5 pt-5 border-t border-rose-50 space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
                RSVP Limit (optional){guestCap !== null && <span className="normal-case font-normal text-stone-400"> — up to {guestCap} on your plan</span>}
              </label>
              <div className="flex gap-3 items-center">
                <div className="relative w-32">
                  <input
                    type="number"
                    min={1}
                    max={guestCap ?? undefined}
                    value={limit ?? ''}
                    onChange={e => {
                      if (!e.target.value) { setLimit(null); return }
                      const parsed = parseInt(e.target.value)
                      setLimit(guestCap !== null ? Math.min(parsed, guestCap) : parsed)
                    }}
                    placeholder="No limit"
                    className="w-32 px-3 py-2 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-200"
                  />
                </div>
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
                  : guestCap !== null
                  ? `Guests can RSVP up to your plan's limit of ${guestCap}.`
                  : 'Guests can RSVP without limit.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">RSVP Closing Date (optional)</label>
              <div className="flex gap-3 items-center">
                <input
                  type="date"
                  value={deadline ?? ''}
                  onChange={e => setDeadline(e.target.value || null)}
                  className="px-3 py-2 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-200"
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
                {deadline
                  ? `Replies close on ${new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`
                  : 'No closing date set — guests can RSVP any time.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Plans modal */}
      {showPlansModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <CreditCard size={26} className="mx-auto mb-3 text-stone-400" />
            <h3 className="font-serif text-xl text-stone-800 text-center mb-2">Activate RSVP</h3>
            <p className="text-sm text-stone-400 text-center mb-1">Enabling RSVP requires an active plan.</p>
            <p className="text-xs text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2 text-center mb-5">
              🎉 You&apos;re on the free beta — RSVP is free to use right now. Subscribe on the <a href="/admin/plans" className="underline">Plans page</a> to unlock full features.
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
