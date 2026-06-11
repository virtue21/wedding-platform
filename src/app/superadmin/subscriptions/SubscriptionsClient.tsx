'use client'

import { useTransition } from 'react'
import { pauseSubscription, resumeSubscription, cancelSubscription } from './actions'

type Sub = {
  id: string
  status: string
  amount_paid: number | null
  paystack_reference: string | null
  created_at: string
  coupleName: string
  planName: string
  slug: string
}

function formatCurrency(kobo: number | null) {
  if (!kobo) return '—'
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
    cancelled: 'bg-red-500/20 text-red-400',
    pending: 'bg-stone-700 text-stone-400',
  }
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${styles[status] ?? 'bg-stone-700 text-stone-400'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function ActionButtons({ sub }: { sub: Sub }) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex gap-2">
      {sub.status === 'active' && (
        <button
          disabled={pending}
          onClick={() => startTransition(() => pauseSubscription(sub.id))}
          className="px-3 py-1 text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors disabled:opacity-50"
        >
          Pause
        </button>
      )}
      {sub.status === 'paused' && (
        <button
          disabled={pending}
          onClick={() => startTransition(() => resumeSubscription(sub.id))}
          className="px-3 py-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors disabled:opacity-50"
        >
          Resume
        </button>
      )}
      {(sub.status === 'active' || sub.status === 'paused') && (
        <button
          disabled={pending}
          onClick={() => {
            if (!confirm(`Cancel subscription for ${sub.coupleName}? This is irreversible.`)) return
            startTransition(() => cancelSubscription(sub.id))
          }}
          className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      )}
    </div>
  )
}

export default function SubscriptionsClient({ subs }: { subs: Sub[] }) {
  const stats = {
    active: subs.filter(s => s.status === 'active').length,
    paused: subs.filter(s => s.status === 'paused').length,
    cancelled: subs.filter(s => s.status === 'cancelled').length,
    revenue: subs
      .filter(s => s.status !== 'pending')
      .reduce((sum, s) => sum + (s.amount_paid ?? 0), 0),
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-white text-2xl font-semibold">Subscriptions</h1>
        <p className="text-stone-400 text-sm mt-1">Manage all customer plan subscriptions</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Active', value: stats.active, color: 'text-green-400' },
          { label: 'Paused', value: stats.paused, color: 'text-yellow-400' },
          { label: 'Cancelled', value: stats.cancelled, color: 'text-red-400' },
          { label: 'Revenue', value: formatCurrency(stats.revenue), color: 'text-rose-400' },
        ].map(s => (
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
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subs.map(s => (
              <tr key={s.id} className="border-b border-stone-800/50 hover:bg-stone-800/20 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="text-white font-medium">{s.coupleName}</p>
                  <p className="text-stone-500 text-xs">/{s.slug}</p>
                </td>
                <td className="px-5 py-3.5 text-stone-300">{s.planName}</td>
                <td className="px-5 py-3.5 text-stone-300">{formatCurrency(s.amount_paid)}</td>
                <td className="px-5 py-3.5"><StatusBadge status={s.status} /></td>
                <td className="px-5 py-3.5 text-stone-400 text-xs">{formatDate(s.created_at)}</td>
                <td className="px-5 py-3.5"><ActionButtons sub={s} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {subs.length === 0 && (
          <div className="text-center py-12 text-stone-500 text-sm">No subscriptions yet</div>
        )}
      </div>
    </div>
  )
}
