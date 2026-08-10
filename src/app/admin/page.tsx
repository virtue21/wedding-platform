import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function StatCard({ label, value, sub, tone }: { label: string; value: string | number; sub: string; tone?: 'green' | 'amber' | 'default' }) {
  const valueColor = tone === 'green' ? 'text-emerald-600' : tone === 'amber' ? 'text-amber-600' : 'text-stone-800'
  return (
    <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-stone-400 mb-2">{label}</p>
      <p className={`font-serif text-3xl mb-1 ${valueColor}`}>{value}</p>
      <p className="text-xs text-stone-400">{sub}</p>
    </div>
  )
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
  ] = await Promise.all([
    supabase.from('guests').select('id').eq('wedding_id', wedding.id).eq('is_removed', false),
    supabase.from('registry_items').select('quantity_needed, quantity_claimed').eq('wedding_id', wedding.id),
    supabase.from('seat_tables').select('id, capacity').eq('wedding_id', wedding.id),
  ])

  const invited = guests?.length ?? 0
  const registryTotal = (registryItems ?? []).reduce((s, i) => s + i.quantity_needed, 0)
  const registryClaimed = (registryItems ?? []).reduce((s, i) => s + i.quantity_claimed, 0)
  const seatCapacity = (tables ?? []).reduce((s, t) => s + t.capacity, 0)

  const daysToGo = wedding.wedding_date
    ? Math.max(0, Math.ceil((new Date(wedding.wedding_date).getTime() - Date.now()) / 86400000))
    : null

  const inviteUrl = wedding.slug ? `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nemiplanner.xyz'}/${wedding.slug}` : null

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
        {inviteUrl && (
          <Link
            href="/admin/settings"
            className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Share your invite link
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Invited" value={invited} sub="On the guest list" />
        <StatCard label="Gifts claimed" value={`${registryClaimed} / ${registryTotal}`} sub="On the registry" tone={registryClaimed > 0 ? 'green' : 'default'} />
        <StatCard label="Seat capacity" value={seatCapacity} sub="Across all tables" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/admin/guests" className="block bg-white rounded-2xl border border-rose-50 shadow-sm p-6 hover:border-rose-200 transition-colors">
          <h2 className="font-serif text-xl text-stone-800 mb-1">Guests</h2>
          <p className="text-sm text-stone-400">{invited} on the list — manage RSVPs, filter by side and category.</p>
        </Link>
        <Link href="/admin/registry" className="block bg-white rounded-2xl border border-rose-50 shadow-sm p-6 hover:border-rose-200 transition-colors">
          <h2 className="font-serif text-xl text-stone-800 mb-1">Registry</h2>
          <p className="text-sm text-stone-400">{registryClaimed} of {registryTotal} claimed — see who&apos;s gifting what.</p>
        </Link>
        <Link href="/admin/tables" className="block bg-white rounded-2xl border border-rose-50 shadow-sm p-6 hover:border-rose-200 transition-colors">
          <h2 className="font-serif text-xl text-stone-800 mb-1">Seating</h2>
          <p className="text-sm text-stone-400">{seatCapacity} seats across your tables — assign guests as replies come in.</p>
        </Link>
        <Link href="/admin/wall" className="block bg-white rounded-2xl border border-rose-50 shadow-sm p-6 hover:border-rose-200 transition-colors">
          <h2 className="font-serif text-xl text-stone-800 mb-1">Wall</h2>
          <p className="text-sm text-stone-400">Wishes and moments your guests have shared.</p>
        </Link>
      </div>
    </div>
  )
}
