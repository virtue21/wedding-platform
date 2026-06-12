'use client'

import Link from 'next/link'

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

export default function SubscriptionsClient({ subs }: { subs: Sub[] }) {
  const paidSubs = subs.filter(s => (s.amount_paid ?? 0) > 0)
  const revenue = paidSubs
    .filter(s => s.status === 'active' || s.status === 'expired')
    .reduce((sum, s) => sum + (s.amount_paid ?? 0), 0)

  const stats = [
    {
      label: 'Paid & Active',
      value: subs.filter(s => s.status === 'active' && (s.amount_paid ?? 0) > 0).length,
      color: 'text-green-400',
    },
    {
      label: 'Free Trials',
      value: subs.filter(s => s.status === 'active' && (s.amount_paid ?? 0) === 0).length,
      color: 'text-blue-400',
    },
    {
      label: 'Incomplete',
      value: subs.filter(s => s.status === 'pending').length,
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
            </tr>
          </thead>
          <tbody>
            {subs.map(s => (
              <tr key={s.id} className="border-b border-stone-800/50 hover:bg-stone-800/20 transition-colors">
                <td className="px-5 py-3.5">
                  <Link href={`/superadmin/customers/${s.wedding_id}`} className="hover:text-rose-400 transition-colors">
                    <p className="text-white font-medium">{s.coupleName}</p>
                    <p className="text-stone-500 text-xs">/{s.slug}</p>
                  </Link>
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
              </tr>
            ))}
          </tbody>
        </table>
        {subs.length === 0 && (
          <div className="text-center py-12 text-stone-500 text-sm">No payments yet</div>
        )}
      </div>
    </div>
  )
}
