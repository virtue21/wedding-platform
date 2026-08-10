'use client'

import { useRouter, useSearchParams } from 'next/navigation'

type RangeKey = 'today' | '7d' | '30d' | 'all' | 'custom'

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'all', label: 'All time' },
  { key: 'custom', label: 'Custom' },
]

export default function DashboardDateFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const range = (searchParams.get('range') as RangeKey) ?? 'today'
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''

  function setRange(next: RangeKey) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', next)
    if (next !== 'custom') {
      params.delete('from')
      params.delete('to')
    }
    router.push(`/superadmin?${params.toString()}`)
  }

  function setCustom(key: 'from' | 'to', value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', 'custom')
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/superadmin?${params.toString()}`)
  }

  return (
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
            value={from}
            onChange={e => setCustom('from', e.target.value)}
            className="bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200"
          />
          <span className="text-stone-500 text-xs">to</span>
          <input
            type="date"
            value={to}
            onChange={e => setCustom('to', e.target.value)}
            className="bg-stone-900 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200"
          />
        </div>
      )}
    </div>
  )
}
