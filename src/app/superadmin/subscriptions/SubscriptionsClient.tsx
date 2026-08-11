'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { reconcilePayment, pauseSubscription, resumeSubscription, cancelSubscription } from './actions'

type Sub = {
  id: string
  status: string
  amount_paid: number | null
  paystack_reference: string | null
  created_at: string
  activated_at?: string | null
  coupleName: string
  planName: string
  slug: string
  wedding_id: string
}

function formatCurrency(kobo: number | null) {
  if (!kobo) return '—'
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    expired: 'bg-stone-700 text-stone-400',
    cancelled: 'bg-red-500/20 text-red-400',
    pending: 'bg-yellow-500/20 text-yellow-400',
  }
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${styles[status] ?? 'bg-stone-700 text-stone-400'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function SubActions({ sub }: { sub: Sub }) {
  const [isPending, startTransition] = useTransition()

  function run(action: (id: string) => Promise<void>) {
    if (isPending) return
    startTransition(() => action(sub.id))
  }

  return (
    <div className="flex items-center gap-1.5">
      {sub.status === 'active' && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(pauseSubscription)}
          className="px-2.5 py-1 text-xs rounded-lg border border-stone-700 text-stone-300 hover:border-amber-500/50 hover:text-amber-400 disabled:opacity-50 transition-colors"
        >
          Pause
        </button>
      )}
      {sub.status === 'paused' && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(resumeSubscription)}
          className="px-2.5 py-1 text-xs rounded-lg border border-stone-700 text-stone-300 hover:border-green-500/50 hover:text-green-400 disabled:opacity-50 transition-colors"
        >
          Resume
        </button>
      )}
      {(sub.status === 'active' || sub.status === 'paused') && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (confirm(`Cancel ${sub.coupleName}'s ${sub.planName} plan? This turns off RSVP and paid features.`)) run(cancelSubscription)
          }}
          className="px-2.5 py-1 text-xs rounded-lg border border-stone-700 text-stone-300 hover:border-red-500/50 hover:text-red-400 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  )
}

function ReconcilePaymentForm() {
  const [reference, setReference] = useState('')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ error?: string; success?: boolean; amountKobo?: number } | null>(null)

  function submit() {
    if (!reference.trim()) return
    setResult(null)
    startTransition(async () => {
      const res = await reconcilePayment(reference.trim())
      setResult(res)
      if (res.success) setReference('')
    })
  }

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
      <h2 className="text-white text-sm font-semibold mb-1">Reconcile a stuck payment</h2>
      <p className="text-stone-500 text-xs mb-3">
        Couple was charged and got confirmation emails, but shows no active plan. Paste the Paystack reference
        (from Paystack&apos;s dashboard or the confirmation email) to re-verify and force-activate.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={reference}
          onChange={e => setReference(e.target.value)}
          placeholder="nemi-couple-slug-123456"
          className="flex-1 bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200 placeholder:text-stone-600 font-mono"
        />
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !reference.trim()}
          className="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
        >
          {isPending ? 'Verifying…' : 'Verify & activate'}
        </button>
      </div>
      {result?.error && (
        <p className="text-red-400 text-xs mt-2">{result.error}</p>
      )}
      {result?.success && (
        <p className="text-green-400 text-xs mt-2">
          Activated — {result.amountKobo ? formatCurrency(result.amountKobo) : 'amount unknown'} confirmed with Paystack.
        </p>
      )}
    </div>
  )
}

type RangeKey = 'today' | '7d' | '30d' | 'all' | 'custom'

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'all', label: 'All time' },
  { key: 'custom', label: 'Custom' },
]

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export default function SubscriptionsClient({ subs }: { subs: Sub[] }) {
  const [range, setRange] = useState<RangeKey>('today')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const filteredSubs = useMemo(() => {
    if (range === 'all') return subs

    const now = new Date()
    let from: Date | null = null
    let to: Date | null = null

    if (range === 'today') {
      from = startOfDay(now)
    } else if (range === '7d') {
      from = startOfDay(new Date(now.getTime() - 6 * 86400000))
    } else if (range === '30d') {
      from = startOfDay(new Date(now.getTime() - 29 * 86400000))
    } else if (range === 'custom') {
      from = customFrom ? startOfDay(new Date(customFrom)) : null
      to = customTo ? new Date(new Date(customTo).getTime() + 86400000) : null
    }

    return subs.filter(s => {
      const at = new Date(s.activated_at ?? s.created_at)
      if (from && at < from) return false
      if (to && at >= to) return false
      return true
    })
  }, [subs, range, customFrom, customTo])

  const paidSubs = filteredSubs.filter(s => (s.amount_paid ?? 0) > 0)
  const revenue = paidSubs
    .filter(s => s.status === 'active' || s.status === 'expired')
    .reduce((sum, s) => sum + (s.amount_paid ?? 0), 0)

  const stats = [
    {
      label: 'Paid & Active',
      value: filteredSubs.filter(s => s.status === 'active' && (s.amount_paid ?? 0) > 0).length,
      color: 'text-green-400',
    },
    {
      label: 'Free Trials',
      value: filteredSubs.filter(s => s.status === 'active' && (s.amount_paid ?? 0) === 0).length,
      color: 'text-blue-400',
    },
    {
      label: 'Incomplete',
      value: filteredSubs.filter(s => s.status === 'pending').length,
      color: 'text-yellow-400',
    },
    { label: 'Revenue', value: formatCurrency(revenue), color: 'text-rose-400' },
  ]

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-white text-2xl font-semibold">Subscriptions</h1>
        <p className="text-stone-400 text-sm mt-1">All plan activations — paid and free trials</p>
      </div>

      <ReconcilePaymentForm />

      {/* Date filter */}
      <div className="flex flex-wrap items-center gap-2">
        {RANGE_OPTIONS.map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setRange(opt.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              range === opt.key
                ? 'bg-rose-500 border-rose-500 text-white'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
        {range === 'custom' && (
          <div className="flex items-center gap-2 ml-1">
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200"
            />
            <span className="text-stone-500 text-xs">to</span>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200"
            />
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-stone-900 border border-stone-800 rounded-xl p-4">
            <p className="text-stone-500 text-xs">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800">
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Customer</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Plan</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Amount</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Status</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Date</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Ref</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubs.map(s => (
              <tr key={s.id} className="border-b border-stone-800/50 hover:bg-stone-800/20 transition-colors">
                <td className="px-5 py-3.5">
                  {s.wedding_id ? (
                    <Link href={`/superadmin/customers/${s.wedding_id}`} className="hover:text-rose-400 transition-colors">
                      <p className="text-white font-medium">{s.coupleName}</p>
                      <p className="text-stone-500 text-xs">/{s.slug}</p>
                    </Link>
                  ) : (
                    <div>
                      <p className="text-white font-medium">{s.coupleName}</p>
                      <p className="text-stone-500 text-xs">/{s.slug}</p>
                    </div>
                  )}
                </td>
                <td className="px-5 py-3.5 text-stone-300">{s.planName}</td>
                <td className="px-5 py-3.5">
                  {(s.amount_paid ?? 0) === 0
                    ? <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400 font-medium">Free trial</span>
                    : <span className="text-stone-300 font-medium">{formatCurrency(s.amount_paid)}</span>
                  }
                </td>
                <td className="px-5 py-3.5"><StatusBadge status={s.status} /></td>
                <td className="px-5 py-3.5 text-stone-400 text-xs">{formatDate(s.activated_at ?? s.created_at)}</td>
                <td className="px-5 py-3.5 text-stone-500 text-xs font-mono">
                  {s.paystack_reference ? s.paystack_reference.slice(0, 12) + '…' : '—'}
                </td>
                <td className="px-5 py-3.5">
                  <SubActions sub={s} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSubs.length === 0 && (
          <div className="text-center py-12 text-stone-500 text-sm">
            {subs.length === 0 ? 'No payments yet' : 'No activity in this date range'}
          </div>
        )}
      </div>
    </div>
  )
}
