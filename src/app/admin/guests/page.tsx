import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import GuestTable from './GuestTable'
import type { Guest, RelationshipCategory } from '@/lib/supabase/database.types'

type GuestWithCategory = Guest & {
  relationship_categories: Pick<RelationshipCategory, 'label'> | null
}

export default async function GuestsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, slug')
    .eq('user_id', user.id)
    .single()

  if (!wedding) {
    return (
      <div className="text-center py-24">
        <p className="text-4xl mb-4">💍</p>
        <h2 className="font-serif text-2xl text-stone-800 mb-2">Set up your wedding first</h2>
        <p className="text-stone-400 text-sm mb-6">Add your details to generate your guest link.</p>
        <Link href="/setup" className="btn-primary">Go to Setup</Link>
      </div>
    )
  }

  const { data: guests } = await supabase
    .from('guests')
    .select('*, relationship_categories(label)')
    .eq('wedding_id', wedding.id)
    .eq('is_removed', false)
    .order('created_at', { ascending: false }) as { data: GuestWithCategory[] | null }

  const list = guests ?? []

  // Stats
  const total = list.length
  const bySide = {
    bride: list.filter(g => g.side === 'bride').length,
    groom: list.filter(g => g.side === 'groom').length,
    both:  list.filter(g => g.side === 'both').length,
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl text-stone-800 mb-1">Guest List</h1>
          <p className="text-stone-400 text-sm">Click any row to view details or add notes</p>
        </div>
        <a
          href="/admin/guests/export"
          className="flex items-center gap-2 px-4 py-2 text-sm border border-rose-100 text-stone-600 hover:border-rose-200 rounded-xl bg-white transition-colors"
        >
          <span>↓</span> Export CSV
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Guests', value: total, color: 'text-stone-800' },
          { label: "Bride's Side", value: bySide.bride, color: 'text-rose-500' },
          { label: "Groom's Side", value: bySide.groom, color: 'text-blue-500' },
          { label: 'Knows Both',   value: bySide.both,  color: 'text-purple-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5">
            <p className={`font-serif text-3xl font-semibold ${color} mb-1`}>{value}</p>
            <p className="text-xs text-stone-400">{label}</p>
          </div>
        ))}
      </div>

      <GuestTable guests={list} />
    </div>
  )
}
