'use client'

import { useState, useTransition } from 'react'
import { grantFreeTrial } from './actions'

type Plan = { id: string; name: string }

const DURATION_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
]

export default function FreeTrialForm({ weddingId, plans }: { weddingId: string; plans: Plan[] }) {
  const [open, setOpen] = useState(false)
  const [planId, setPlanId] = useState(plans[0]?.id ?? '')
  const [days, setDays] = useState(30)
  const [done, setDone] = useState(false)
  const [pending, start] = useTransition()

  function handleGrant() {
    if (!planId) return
    start(async () => {
      await grantFreeTrial(weddingId, planId, days)
      setDone(true)
      setTimeout(() => { setDone(false); setOpen(false) }, 2000)
    })
  }

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-sm font-semibold">Free Trial</h2>
          <p className="text-stone-500 text-xs mt-0.5">Grant this customer a free trial on any plan</p>
        </div>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 text-sm bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-xl transition-colors font-medium"
          >
            + Grant Trial
          </button>
        )}
      </div>

      {open && (
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-stone-400 text-xs block mb-1.5">Plan</label>
              <select
                value={planId}
                onChange={e => setPlanId(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-stone-400 text-xs block mb-1.5">Duration</label>
              <select
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              >
                {DURATION_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-stone-500 text-xs">
            This will create an active subscription (₦0 paid) expiring in {days} days. Any existing active subscription will be expired.
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              disabled={pending}
              className="flex-1 px-4 py-2.5 text-sm border border-stone-700 text-stone-400 hover:text-stone-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGrant}
              disabled={pending || !planId || done}
              className="flex-1 px-4 py-2.5 text-sm bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {done ? '✓ Trial granted!' : pending ? 'Granting…' : `Grant ${days}-day trial`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
