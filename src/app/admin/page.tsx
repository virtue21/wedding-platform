import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ShareInviteButton from './ShareInviteButton'

function StatCard({ label, value, sub, tone }: { label: string; value: string | number; sub: string; tone?: 'green' | 'amber' | 'rose' | 'default' }) {
  const valueColor = {
    green: 'text-emerald-600',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    default: 'text-stone-800',
  }[tone ?? 'default']
  return (
    <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5 h-full">
      <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400 mb-2">{label}</p>
      <p className={`font-serif text-3xl mb-1 ${valueColor}`}>{value}</p>
      <p className="text-xs text-stone-400">{sub}</p>
    </div>
  )
}

type ActivityEvent = { key: string; text: string; at: string }

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

export default async function AdminOverviewPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, slug, wedding_date, rsvp_deadline')
    .eq('user_id', user.id)
    .single()
  if (!wedding) redirect('/setup')

  const [
    { data: guests },
    { data: registryItems },
    { data: tables },
    { data: recentGuests },
    { data: recentClaims },
    { data: recentNotes },
  ] = await Promise.all([
    supabase.from('guests').select('id').eq('wedding_id', wedding.id).eq('is_removed', false),
    supabase.from('registry_items').select('quantity_needed, quantity_claimed').eq('wedding_id', wedding.id),
    supabase.from('seat_tables').select('id, capacity').eq('wedding_id', wedding.id),
    supabase.from('guests').select('full_name, rsvp_date').eq('wedding_id', wedding.id).eq('is_removed', false).order('rsvp_date', { ascending: false }).limit(4),
    supabase.from('gift_claims').select('guest_name, claimed_at, registry_items!inner(name, wedding_id)').eq('registry_items.wedding_id', wedding.id).order('claimed_at', { ascending: false }).limit(4),
    supabase.from('wedding_notes').select('author_name, created_at').eq('wedding_id', wedding.id).order('created_at', { ascending: false }).limit(4),
  ])

  const invited = guests?.length ?? 0
  const registryTotal = (registryItems ?? []).reduce((s, i) => s + i.quantity_needed, 0)
  const registryClaimed = (registryItems ?? []).reduce((s, i) => s + i.quantity_claimed, 0)
  const seatCapacity = (tables ?? []).reduce((s, t) => s + t.capacity, 0)

  const daysToGo = wedding.wedding_date
    ? Math.max(0, Math.ceil((new Date(wedding.wedding_date).getTime() - Date.now()) / 86400000))
    : null

  const inviteUrl = wedding.slug ? `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nemiplanner.xyz'}/${wedding.slug}` : null

  const activity: ActivityEvent[] = [
    ...(recentGuests ?? []).map(g => ({ key: `g-${g.full_name}-${g.rsvp_date}`, text: `${g.full_name} confirmed`, at: g.rsvp_date })),
    ...(recentClaims ?? []).map(c => ({
      key: `c-${c.guest_name}-${c.claimed_at}`,
      text: `${c.guest_name} claimed ${(c.registry_items as unknown as { name: string } | null)?.name ?? 'a gift'}`,
      at: c.claimed_at,
    })),
    ...(recentNotes ?? []).map(n => ({ key: `n-${n.author_name}-${n.created_at}`, text: `${n.author_name} left a wish on the wall`, at: n.created_at })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 5)

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl text-stone-800 mb-1">Overview</h1>
          <p className="text-stone-400 text-sm">
            {daysToGo !== null ? `${daysToGo} days to go` : 'Set your wedding date in Setup'}
            {wedding.rsvp_deadline && ` · replies close ${new Date(wedding.rsvp_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
          </p>
        </div>
        {inviteUrl && <ShareInviteButton url={inviteUrl} />}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Confirmed" value={invited} sub="Guests on the list" tone="green" />
        <StatCard label="Gifts claimed" value={`${registryClaimed} / ${registryTotal}`} sub="On the registry" tone={registryClaimed > 0 ? 'rose' : 'default'} />
        <StatCard label="Seat capacity" value={seatCapacity} sub="Across all tables" tone="amber" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 items-stretch">
        <Link href="/admin/guests" className="block bg-white rounded-2xl border border-rose-50 shadow-sm p-6 hover:border-rose-200 transition-colors">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-serif text-xl text-stone-800">Guests</h2>
            <span className="text-xs text-rose-500 font-medium">See all →</span>
          </div>
          <p className="text-sm text-stone-400">{invited} confirmed so far — manage RSVPs, filter by side and category.</p>
        </Link>

        <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-6">
          <h2 className="font-serif text-xl text-stone-800 mb-3">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-stone-400">Nothing yet — activity shows up here as guests RSVP, claim gifts, or leave wishes.</p>
          ) : (
            <div className="space-y-3">
              {activity.map(e => (
                <div key={e.key} className="flex items-baseline justify-between gap-3 text-sm">
                  <p className="text-stone-700 truncate">{e.text}</p>
                  <p className="text-xs text-stone-400 shrink-0">{timeAgo(e.at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 items-stretch">
        <Link href="/admin/registry" className="block bg-white rounded-2xl border border-rose-50 shadow-sm p-6 hover:border-rose-200 transition-colors">
          <h2 className="font-serif text-xl text-stone-800 mb-1">Registry</h2>
          <p className="text-sm text-stone-400">{registryClaimed} of {registryTotal} claimed — see who&apos;s gifting what.</p>
        </Link>
        <Link href="/admin/tables" className="block bg-white rounded-2xl border border-rose-50 shadow-sm p-6 hover:border-rose-200 transition-colors">
          <h2 className="font-serif text-xl text-stone-800 mb-1">Seating</h2>
          <p className="text-sm text-stone-400">{seatCapacity} seats across your tables — assign guests as replies come in.</p>
        </Link>
      </div>
    </div>
  )
}
