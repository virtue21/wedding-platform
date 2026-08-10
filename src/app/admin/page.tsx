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
    .select('id, slug, wedding_date, rsvp_deadline, rsvp_limit')
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
    supabase.from('guests').select('id, table_id').eq('wedding_id', wedding.id).eq('is_removed', false),
    supabase.from('registry_items').select('quantity_needed, quantity_claimed').eq('wedding_id', wedding.id),
    supabase.from('seat_tables').select('id, capacity').eq('wedding_id', wedding.id),
    supabase.from('guests').select('full_name, rsvp_date').eq('wedding_id', wedding.id).eq('is_removed', false).order('rsvp_date', { ascending: false }).limit(4),
    supabase.from('gift_claims').select('guest_name, claimed_at, registry_items!inner(name, wedding_id)').eq('registry_items.wedding_id', wedding.id).order('claimed_at', { ascending: false }).limit(4),
    supabase.from('wedding_notes').select('author_name, created_at').eq('wedding_id', wedding.id).order('created_at', { ascending: false }).limit(4),
  ])

  const confirmed = guests?.length ?? 0
  const unseated = (guests ?? []).filter(g => !g.table_id).length
  const registryTotal = (registryItems ?? []).reduce((s, i) => s + i.quantity_needed, 0)
  const registryClaimed = (registryItems ?? []).reduce((s, i) => s + i.quantity_claimed, 0)
  const seatCapacity = (tables ?? []).reduce((s, t) => s + t.capacity, 0)

  // The couple's own RSVP cap is the only real "expected headcount" this app
  // has — there's no pre-loaded invite list, so without a cap set there is no
  // meaningful "awaiting" number and that card stays hidden.
  const target = wedding.rsvp_limit ?? null
  const awaiting = target !== null ? Math.max(0, target - confirmed) : null

  const daysToGo = wedding.wedding_date
    ? Math.max(0, Math.ceil((new Date(wedding.wedding_date).getTime() - Date.now()) / 86400000))
    : null

  const daysToDeadline = wedding.rsvp_deadline
    ? Math.max(0, Math.ceil((new Date(wedding.rsvp_deadline).getTime() - Date.now()) / 86400000))
    : null

  const inviteUrl = wedding.slug ? `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nemiplanner.xyz'}/${wedding.slug}` : null

  const activity: ActivityEvent[] = [
    ...(recentGuests ?? []).map(g => ({ key: `g-${g.full_name}-${g.rsvp_date}`, text: `${g.full_name} confirmed`, at: g.rsvp_date })),
    ...(recentClaims ?? []).map(c => ({
      key: `c-${c.guest_name}-${c.claimed_at}`,
      text: `${c.guest_name?.trim() || 'Someone'} claimed ${(c.registry_items as unknown as { name: string } | null)?.name ?? 'a gift'}`,
      at: c.claimed_at,
    })),
    ...(recentNotes ?? []).map(n => ({ key: `n-${n.author_name}-${n.created_at}`, text: `${n.author_name} left a wish on the wall`, at: n.created_at })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-800 mb-1">Overview</h1>
          <p className="text-stone-400 text-sm">
            {daysToGo !== null ? `${daysToGo} ${daysToGo === 1 ? 'day' : 'days'} to go` : 'Set your wedding date in Setup'}
            {wedding.rsvp_deadline && ` · replies close ${new Date(wedding.rsvp_deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`}
          </p>
        </div>
        {inviteUrl && <ShareInviteButton url={inviteUrl} />}
      </div>

      <div className={`grid gap-4 ${awaiting !== null ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-3'}`}>
        {target !== null && (
          <StatCard label="Expected" value={target} sub="Your RSVP cap" />
        )}
        <StatCard label="Coming" value={confirmed} sub="Confirmed their attendance" tone="green" />
        {awaiting !== null && (
          <StatCard
            label="Awaiting"
            value={awaiting}
            sub={daysToDeadline !== null ? `Deadline in ${daysToDeadline} days` : 'Places still open'}
            tone="amber"
          />
        )}
        {target === null && (
          <StatCard label="Unseated" value={unseated} sub={`Of ${confirmed} confirmed`} tone="amber" />
        )}
        <StatCard
          label="Gifts claimed"
          value={registryClaimed}
          sub={registryTotal > 0 ? `of ${registryTotal} on the registry` : 'No registry items yet'}
          tone={registryClaimed > 0 ? 'rose' : 'default'}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 items-stretch">
        <div className="flex flex-col bg-white rounded-2xl border border-rose-50 shadow-sm p-6 h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl text-stone-800">RSVP progress</h2>
            <Link href="/admin/guests" className="text-xs text-rose-500 font-medium">See all guests →</Link>
          </div>

          <div className="flex-1 flex items-center">
            <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: target && target > 0 ? `${Math.min(100, (confirmed / target) * 100)}%` : confirmed > 0 ? '100%' : '0%' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-5 mt-6 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-stone-500">Coming</span>
              <span className="font-medium text-stone-800">{confirmed}</span>
            </span>
            {awaiting !== null && (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-stone-300" />
                <span className="text-stone-500">Awaiting</span>
                <span className="font-medium text-stone-800">{awaiting}</span>
              </span>
            )}
          </div>

          {target === null && (
            <p className="text-xs text-stone-400 mt-3">
              Set an RSVP limit in Settings to track progress against a target headcount.
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-6 h-full">
          <h2 className="font-serif text-xl text-stone-800 mb-4">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-stone-400">Nothing yet — activity shows up here as guests RSVP, claim gifts, or leave wishes.</p>
          ) : (
            <div className="space-y-3.5">
              {activity.map(e => (
                <div key={e.key} className="flex items-baseline justify-between gap-3 text-sm border-b border-stone-50 last:border-0 pb-3.5 last:pb-0">
                  <p className="text-stone-700 truncate">{e.text}</p>
                  <p className="text-xs text-stone-400 shrink-0">{timeAgo(e.at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 items-stretch">
        <Link href="/admin/registry" className="flex flex-col bg-white rounded-2xl border border-rose-50 shadow-sm p-6 hover:border-rose-200 transition-colors h-full">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-xl text-stone-800">Registry</h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 shrink-0">
              {registryTotal > 0 ? `${registryClaimed} of ${registryTotal} claimed` : 'No items yet'}
            </span>
          </div>
          {registryTotal > 0 && (
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (registryClaimed / registryTotal) * 100)}%` }} />
            </div>
          )}
          <p className="text-sm text-stone-400 mt-auto">
            {registryTotal === 0
              ? 'Add gifts your guests can buy or send cash for.'
              : registryClaimed === 0
              ? 'Nobody has claimed anything yet.'
              : `${registryClaimed} claimed so far — see who's gifting what.`}
          </p>
        </Link>
        <Link href="/admin/tables" className="flex flex-col bg-white rounded-2xl border border-rose-50 shadow-sm p-6 hover:border-rose-200 transition-colors h-full">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-xl text-stone-800">Seating</h2>
            <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${unseated > 0 ? 'bg-amber-50 text-amber-600' : 'bg-stone-100 text-stone-500'}`}>
              {unseated > 0 ? `${unseated} unseated` : 'All seated'}
            </span>
          </div>
          {seatCapacity > 0 && (
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, ((confirmed - unseated) / seatCapacity) * 100)}%` }} />
            </div>
          )}
          <p className="text-sm text-stone-400 mt-auto">
            {seatCapacity === 0
              ? 'Create tables to start assigning guests.'
              : `${confirmed - unseated} of ${confirmed} seated across ${seatCapacity} seats.`}
          </p>
        </Link>
      </div>
    </div>
  )
}
