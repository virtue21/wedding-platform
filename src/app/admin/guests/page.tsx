import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import GuestTable from './GuestTable'
import OnboardingChecklist from '@/components/OnboardingChecklist'
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
    .select('id, slug, wedding_date, venue_name, cover_image_url')
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

  const [guestsResult, categoriesResult, registryResult] = await Promise.all([
    supabase
      .from('guests')
      .select('*, relationship_categories(label)')
      .eq('wedding_id', wedding.id)
      .eq('is_removed', false)
      .order('created_at', { ascending: false }) as unknown as Promise<{ data: GuestWithCategory[] | null }>,
    supabase
      .from('relationship_categories')
      .select('id')
      .eq('wedding_id', wedding.id)
      .limit(1),
    supabase
      .from('registry_items')
      .select('id')
      .eq('wedding_id', wedding.id)
      .limit(1),
  ])

  const list = guestsResult.data ?? []
  const total = list.length
  const bySide = {
    bride: list.filter(g => g.side === 'bride').length,
    groom: list.filter(g => g.side === 'groom').length,
    both:  list.filter(g => g.side === 'both').length,
  }

  // Checklist step completion
  const hasWeddingDetails = !!(wedding.wedding_date && wedding.venue_name)
  const hasCategories = (categoriesResult.data?.length ?? 0) > 0
  const hasRegistry = (registryResult.data?.length ?? 0) > 0

  const checklistSteps = [
    {
      id: 'details',
      label: 'Complete your wedding details',
      description: 'Add your wedding date and venue. A cover photo makes your invite page look great too.',
      href: '/setup',
      done: hasWeddingDetails,
    },
    {
      id: 'categories',
      label: 'Set up guest categories',
      description: 'Define how guests know you — Family, Church, Work, etc. Guests pick this when they RSVP.',
      href: '/admin/categories',
      done: hasCategories,
    },
    {
      id: 'registry',
      label: 'Build your gift registry',
      description: 'Add items guests can buy or send the cash equivalent for.',
      href: '/admin/registry',
      done: hasRegistry,
    },
    {
      id: 'share',
      label: 'Share your invite link with guests',
      description: 'Copy your link from Setup and send it to guests via WhatsApp, Instagram, or print the QR code.',
      href: '/setup',
      done: total > 0,
    },
  ]

  return (
    <div>
      {/* Onboarding checklist — shown until dismissed */}
      <OnboardingChecklist steps={checklistSteps} slug={wedding.slug} />

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl text-stone-800 mb-1">Guest List</h1>
          <p className="text-stone-400 text-sm">
            {total === 0
              ? 'No guests yet — share your link to get RSVPs'
              : `${total} ${total === 1 ? 'guest' : 'guests'} · click any row to view details`}
          </p>
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
