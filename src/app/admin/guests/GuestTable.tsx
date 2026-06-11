'use client'

import { useState, useTransition } from 'react'
import { removeGuest, saveGuestNotes } from './actions'
import type { Guest, RelationshipCategory } from '@/lib/supabase/database.types'

type GuestWithCategory = Guest & {
  relationship_categories: Pick<RelationshipCategory, 'label'> | null
}

type Props = {
  guests: GuestWithCategory[]
}

function SideBadge({ side }: { side: string }) {
  const styles: Record<string, string> = {
    bride: 'bg-rose-50 text-rose-600 border-rose-100',
    groom: 'bg-blue-50 text-blue-600 border-blue-100',
    both:  'bg-purple-50 text-purple-600 border-purple-100',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${styles[side] ?? ''}`}>
      {side}
    </span>
  )
}

function GuestRow({ guest }: { guest: GuestWithCategory }) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState(guest.notes ?? '')
  const [isPending, startTransition] = useTransition()

  return (
    <>
      <tr
        className="border-b border-rose-50 hover:bg-rose-50/40 cursor-pointer transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="py-3.5 px-4 text-sm font-medium text-stone-800">{guest.full_name}</td>
        <td className="py-3.5 px-4 text-sm text-stone-500">{guest.phone}</td>
        <td className="py-3.5 px-4 text-sm text-stone-400">{guest.email ?? '—'}</td>
        <td className="py-3.5 px-4"><SideBadge side={guest.side} /></td>
        <td className="py-3.5 px-4 text-sm text-stone-500">{guest.relationship_categories?.label ?? '—'}</td>
        <td className="py-3.5 px-4 text-xs text-stone-400">
          {new Date(guest.rsvp_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
        </td>
        <td className="py-3.5 px-4 text-right">
          <span className="text-stone-300 text-xs">{expanded ? '▲' : '▼'}</span>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-rose-50/30 border-b border-rose-50">
          <td colSpan={7} className="px-4 py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
                  Private notes
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Uncle from Enugu, needs hotel info"
                  className="w-full px-3 py-2 text-sm text-stone-700 border border-rose-100 rounded-xl bg-white placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none"
                />
                <button
                  onClick={() => startTransition(() => saveGuestNotes(guest.id, notes))}
                  disabled={isPending}
                  className="mt-2 px-3 py-1.5 text-xs bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Saving…' : 'Save note'}
                </button>
              </div>
              <div className="shrink-0">
                <button
                  onClick={() => {
                    if (confirm(`Remove ${guest.full_name} from the guest list?`)) {
                      startTransition(() => removeGuest(guest.id))
                    }
                  }}
                  disabled={isPending}
                  className="px-3 py-1.5 text-xs text-red-500 hover:text-red-700 border border-red-100 hover:border-red-200 rounded-lg transition-colors"
                >
                  Remove guest
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function GuestTable({ guests }: Props) {
  const [search, setSearch] = useState('')
  const [sideFilter, setSideFilter] = useState<'all' | 'bride' | 'groom' | 'both'>('all')

  const filtered = guests.filter(g => {
    const matchSearch = !search || g.full_name.toLowerCase().includes(search.toLowerCase()) || g.phone.includes(search)
    const matchSide = sideFilter === 'all' || g.side === sideFilter
    return matchSearch && matchSide
  })

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by name or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3.5 py-2.5 border border-rose-100 rounded-xl text-sm text-stone-800 placeholder:text-stone-400 bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
        <div className="flex gap-2">
          {(['all', 'bride', 'groom', 'both'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSideFilter(s)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                sideFilter === s
                  ? 'bg-rose-500 text-white'
                  : 'bg-white border border-rose-100 text-stone-500 hover:border-rose-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-rose-50">
          <p className="text-3xl mb-3">💌</p>
          <p className="font-serif text-lg text-stone-600 mb-1">
            {search || sideFilter !== 'all' ? 'No guests match your filters' : 'No guests yet'}
          </p>
          <p className="text-stone-400 text-sm">
            {search || sideFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Share your wedding link to start receiving RSVPs.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-rose-50 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rose-50 bg-rose-50/50">
                <th className="text-left py-3 px-4 text-xs font-medium text-stone-400 uppercase tracking-wide">Name</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-stone-400 uppercase tracking-wide">Phone</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-stone-400 uppercase tracking-wide">Email</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-stone-400 uppercase tracking-wide">Side</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-stone-400 uppercase tracking-wide">Category</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-stone-400 uppercase tracking-wide">RSVP&apos;d</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(g => <GuestRow key={g.id} guest={g} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
