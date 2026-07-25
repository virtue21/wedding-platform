'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

export type CustomerRow = {
  userId: string
  weddingId: string | null
  name: string
  email: string
  slug: string | null
  emailVerified: boolean
  signedUpAt: string
  setupComplete: boolean
  planName: string | null
  isTrial: boolean
  subPaused: boolean
  guests: number
  rsvpEnabled: boolean
}

type SetupFilter = 'all' | 'complete' | 'incomplete'
type SubFilter = 'all' | 'active' | 'trial' | 'none'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function CustomersClient({ rows }: { rows: CustomerRow[] }) {
  const [search, setSearch] = useState('')
  const [setupFilter, setSetupFilter] = useState<SetupFilter>('all')
  const [subFilter, setSubFilter] = useState<SubFilter>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (search) {
        const q = search.toLowerCase()
        const hit = r.name.toLowerCase().includes(q)
          || r.email.toLowerCase().includes(q)
          || (r.slug ?? '').toLowerCase().includes(q)
        if (!hit) return false
      }
      if (setupFilter === 'complete' && !r.setupComplete) return false
      if (setupFilter === 'incomplete' && r.setupComplete) return false

      if (subFilter === 'active' && !(r.planName && !r.isTrial)) return false
      if (subFilter === 'trial' && !r.isTrial) return false
      if (subFilter === 'none' && r.planName) return false

      // Date range applies to signup date
      const signed = new Date(r.signedUpAt).getTime()
      if (from && signed < new Date(from).getTime()) return false
      // Include the whole "to" day
      if (to && signed > new Date(to).getTime() + 86_400_000 - 1) return false

      return true
    })
  }, [rows, search, setupFilter, subFilter, from, to])

  function handleExport() {
    const header = ['Name', 'Email', 'Email verified', 'Slug', 'Setup complete', 'Plan', 'Trial', 'Guests', 'RSVP open', 'Signed up']
    const body = filtered.map(r => [
      r.name,
      r.email,
      r.emailVerified ? 'Yes' : 'No',
      r.slug ?? '',
      r.setupComplete ? 'Yes' : 'No',
      r.planName ?? 'None',
      r.isTrial ? 'Yes' : 'No',
      String(r.guests),
      r.rsvpEnabled ? 'Yes' : 'No',
      new Date(r.signedUpAt).toISOString().slice(0, 10),
    ])
    const csv = [header, ...body]
      .map(cols => cols.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `nemiplanner-customers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = useMemo(() => ({
    total: rows.length,
    complete: rows.filter(r => r.setupComplete).length,
    paying: rows.filter(r => r.planName && !r.isTrial).length,
    trial: rows.filter(r => r.isTrial).length,
  }), [rows])

  const selectClass =
    'px-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/40'

  return (
    <div className="p-8 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-semibold">Customers</h1>
          <p className="text-stone-400 text-sm mt-1">
            {stats.total} signed up · {stats.complete} set up · {stats.paying} paying · {stats.trial} on trial
          </p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl transition-colors whitespace-nowrap"
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, email or slug…"
          className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
        />

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="text-stone-500 text-xs">Setup</span>
            <select
              value={setupFilter}
              onChange={e => setSetupFilter(e.target.value as SetupFilter)}
              className={selectClass}
            >
              <option value="all">All</option>
              <option value="complete">Completed</option>
              <option value="incomplete">Not completed</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-stone-500 text-xs">Subscription</span>
            <select
              value={subFilter}
              onChange={e => setSubFilter(e.target.value as SubFilter)}
              className={selectClass}
            >
              <option value="all">All</option>
              <option value="active">Paying</option>
              <option value="trial">Trial</option>
              <option value="none">None</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-stone-500 text-xs">From</span>
            <input
              type="date" value={from} onChange={e => setFrom(e.target.value)}
              className={selectClass}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-stone-500 text-xs">To</span>
            <input
              type="date" value={to} onChange={e => setTo(e.target.value)}
              className={selectClass}
            />
          </label>

          {(search || setupFilter !== 'all' || subFilter !== 'all' || from || to) && (
            <button
              onClick={() => { setSearch(''); setSetupFilter('all'); setSubFilter('all'); setFrom(''); setTo('') }}
              className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <p className="text-stone-500 text-xs">
        Showing {filtered.length} of {rows.length}
      </p>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="border-b border-stone-800">
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Customer</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Email</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Setup</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Plan</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Guests</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">RSVP</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Signed up</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.userId} className="border-b border-stone-800/50 hover:bg-stone-800/30 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="text-white font-medium">{r.name}</p>
                  {r.slug && <p className="text-stone-500 text-xs mt-0.5">/{r.slug}</p>}
                </td>
                <td className="px-5 py-3.5">
                  <p className="text-stone-400 text-xs">{r.email}</p>
                  {!r.emailVerified && (
                    <span className="text-amber-400/80 text-[11px]">unverified</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    r.setupComplete ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {r.setupComplete ? 'Complete' : 'Not set up'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {r.planName ? (
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      r.subPaused ? 'bg-yellow-500/20 text-yellow-400'
                        : r.isTrial ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {r.planName}{r.isTrial ? ' (Trial)' : r.subPaused ? ' (Paused)' : ''}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-stone-800 text-stone-500 text-xs rounded-full">None</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-stone-300">{r.setupComplete ? r.guests : '—'}</td>
                <td className="px-5 py-3.5">
                  {r.setupComplete ? (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      r.rsvpEnabled && r.planName ? 'bg-green-500/20 text-green-400' : 'bg-stone-800 text-stone-500'
                    }`}>
                      {r.rsvpEnabled && r.planName ? 'Open' : 'Closed'}
                    </span>
                  ) : (
                    <span className="text-stone-600 text-xs">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-stone-400 text-xs">{formatDate(r.signedUpAt)}</td>
                <td className="px-5 py-3.5">
                  {r.weddingId ? (
                    <Link
                      href={`/superadmin/customers/${r.weddingId}`}
                      className="px-3 py-1.5 text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors whitespace-nowrap"
                    >
                      View →
                    </Link>
                  ) : (
                    <span className="text-stone-600 text-xs">No wedding yet</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-stone-500 text-sm">
            {rows.length === 0 ? 'No customers yet' : 'No customers match these filters'}
          </div>
        )}
      </div>
    </div>
  )
}
