import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { SubscriptionActions, RsvpToggle } from './CustomerActions'

function serviceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatCurrency(kobo: number | null) {
  if (!kobo) return '—'
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
    cancelled: 'bg-red-500/20 text-red-400',
    expired: 'bg-stone-700 text-stone-400',
    pending: 'bg-stone-700 text-stone-400',
  }
  return map[status] ?? 'bg-stone-700 text-stone-400'
}

export default async function CustomerDetailPage({ params }: { params: { weddingId: string } }) {
  const sb = serviceClient()
  const { weddingId } = params

  const { data: wedding } = await sb
    .from('weddings')
    .select('*')
    .eq('id', weddingId)
    .single()

  if (!wedding) notFound()

  const [
    { data: profile },
    { data: allSubs },
    { data: guests },
    { data: registryItems },
    { data: photos },
    { data: notes },
    { data: slides },
    authResult,
  ] = await Promise.all([
    sb.from('user_profiles').select('*').eq('id', wedding.user_id).single(),
    sb.from('wedding_subscriptions')
      .select('*, plans(name, price_kobo)')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false }),
    sb.from('guests').select('id, created_at, is_removed').eq('wedding_id', weddingId),
    sb.from('registry_items').select('id, name, price, quantity_claimed').eq('wedding_id', weddingId),
    sb.from('wedding_photos').select('id').eq('wedding_id', weddingId),
    sb.from('wedding_notes').select('id').eq('wedding_id', weddingId),
    sb.from('wedding_story_slides').select('id').eq('wedding_id', weddingId),
    sb.auth.admin.getUserById(wedding.user_id),
  ])

  const email = authResult.data?.user?.email ?? '—'
  const authCreatedAt = authResult.data?.user?.created_at ?? null
  const lastSignIn = authResult.data?.user?.last_sign_in_at ?? null

  const activeSub = allSubs?.find(s => s.status === 'active' || s.status === 'paused') ?? null
  const totalGuests = (guests ?? []).filter(g => !g.is_removed).length
  const totalRevenue = (allSubs ?? [])
    .filter(s => s.status !== 'pending')
    .reduce((sum, s) => sum + (s.amount_paid ?? 0), 0)

  const coupleName = profile ? `${profile.bride_name} & ${profile.groom_name}` : wedding.slug

  const stats = [
    { label: 'RSVPs', value: totalGuests, icon: '👥' },
    { label: 'Registry Items', value: (registryItems ?? []).length, icon: '🎁' },
    { label: 'Photos', value: (photos ?? []).length, icon: '📸' },
    { label: 'Wishes', value: (notes ?? []).length, icon: '💌' },
    { label: 'Story Slides', value: (slides ?? []).length, icon: '💑' },
    { label: 'Gifts Claimed', value: (registryItems ?? []).reduce((s, i) => s + (i.quantity_claimed ?? 0), 0), icon: '🎀' },
  ]

  return (
    <div className="p-8 max-w-4xl space-y-6">

      {/* Back + header */}
      <div>
        <Link href="/superadmin/customers" className="text-stone-500 hover:text-stone-300 text-sm transition-colors">
          ← All Customers
        </Link>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-white text-2xl font-semibold">{coupleName}</h1>
            <p className="text-stone-400 text-sm mt-1">
              <a
                href={`${process.env.NEXT_PUBLIC_APP_URL}/${wedding.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-rose-400 transition-colors"
              >
                nemiplanner.xyz/{wedding.slug} ↗
              </a>
            </p>
          </div>
          {activeSub && (
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColor(activeSub.status)}`}>
              {(activeSub.plans as unknown as { name: string } | null)?.name ?? 'Paid'}{activeSub.status === 'paused' ? ' · Paused' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Account info */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
        <h2 className="text-white text-sm font-semibold mb-4">Account</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <p className="text-stone-500 text-xs mb-0.5">Email</p>
            <p className="text-stone-200">{email}</p>
          </div>
          <div>
            <p className="text-stone-500 text-xs mb-0.5">Account created</p>
            <p className="text-stone-200">{formatDateTime(authCreatedAt)}</p>
          </div>
          <div>
            <p className="text-stone-500 text-xs mb-0.5">Last sign in</p>
            <p className="text-stone-200">{formatDateTime(lastSignIn)}</p>
          </div>
          <div>
            <p className="text-stone-500 text-xs mb-0.5">Wedding date</p>
            <p className="text-stone-200">{formatDate(wedding.wedding_date)}</p>
          </div>
          <div>
            <p className="text-stone-500 text-xs mb-0.5">Venue</p>
            <p className="text-stone-200">{wedding.venue_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-stone-500 text-xs mb-0.5">Total revenue</p>
            <p className="text-rose-400 font-semibold">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Usage stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-stone-900 border border-stone-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-stone-500 text-xs">{s.label}</p>
              <span className="text-base">{s.icon}</span>
            </div>
            <p className="text-white text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* RSVP toggle */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
        <RsvpToggle weddingId={weddingId} enabled={wedding.rsvp_enabled ?? false} />
      </div>

      {/* Active subscription */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-5">
        <h2 className="text-white text-sm font-semibold">Current Subscription</h2>

        {activeSub ? (
          <>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <p className="text-stone-500 text-xs mb-0.5">Plan</p>
                <p className="text-stone-200">{(activeSub.plans as unknown as { name: string } | null)?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-stone-500 text-xs mb-0.5">Status</p>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColor(activeSub.status)}`}>
                  {activeSub.status.charAt(0).toUpperCase() + activeSub.status.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-stone-500 text-xs mb-0.5">Amount paid</p>
                <p className="text-stone-200">{formatCurrency(activeSub.amount_paid)}</p>
              </div>
              <div>
                <p className="text-stone-500 text-xs mb-0.5">Activated</p>
                <p className="text-stone-200">{formatDateTime(activeSub.activated_at)}</p>
              </div>
              {activeSub.paystack_reference && (
                <div>
                  <p className="text-stone-500 text-xs mb-0.5">Paystack reference</p>
                  <p className="text-stone-400 text-xs font-mono">{activeSub.paystack_reference}</p>
                </div>
              )}
            </div>

            <div className="pt-1 border-t border-stone-800">
              <SubscriptionActions
                sub={{ id: activeSub.id, status: activeSub.status, weddingId }}
              />
            </div>
          </>
        ) : (
          <p className="text-stone-500 text-sm">No active subscription — on free tier</p>
        )}
      </div>

      {/* Purchase history */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
        <h2 className="text-white text-sm font-semibold mb-4">Purchase History</h2>

        {(allSubs ?? []).length === 0 ? (
          <p className="text-stone-500 text-sm">No purchases yet</p>
        ) : (
          <div className="space-y-0">
            {(allSubs ?? []).map((s, i) => (
              <div
                key={s.id}
                className={`flex items-center justify-between py-3.5 text-sm ${i < (allSubs ?? []).length - 1 ? 'border-b border-stone-800' : ''}`}
              >
                <div>
                  <p className="text-stone-200 font-medium">
                    {(s.plans as unknown as { name: string } | null)?.name ?? 'Plan'}
                  </p>
                  <p className="text-stone-500 text-xs mt-0.5">{formatDateTime(s.created_at)}</p>
                  {s.paystack_reference && (
                    <p className="text-stone-600 text-xs font-mono mt-0.5">{s.paystack_reference}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-stone-200 font-medium">{formatCurrency(s.amount_paid)}</p>
                  <span className={`mt-1 inline-block px-2 py-0.5 text-xs rounded-full font-medium ${statusColor(s.status)}`}>
                    {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
