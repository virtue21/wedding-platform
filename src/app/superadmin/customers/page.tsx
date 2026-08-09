import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import CustomersClient, { type CustomerRow } from './CustomersClient'

// Ops tooling must always reflect live data — never serve a cached page
// or a cached Supabase fetch.
export const dynamic = 'force-dynamic'

function serviceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function CustomersPage() {
  const sb = serviceClient()

  // Everyone who has an account — the spine of the list. Weddings only exist
  // once Setup is saved, so starting from weddings would hide abandoned signups.
  const { data: authList } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const users = authList?.users ?? []

  const [
    { data: weddings },
    { data: profiles },
    { data: subs },
    { data: guestRows },
  ] = await Promise.all([
    sb.from('weddings').select('id, slug, created_at, user_id, rsvp_enabled'),
    sb.from('user_profiles').select('id, bride_name, groom_name'),
    sb.from('wedding_subscriptions')
      .select('wedding_id, status, expires_at, amount_paid, plans(name)')
      .in('status', ['active', 'paused']),
    sb.from('guests').select('wedding_id').eq('is_removed', false),
  ])

  const weddingByUser = Object.fromEntries((weddings ?? []).map(w => [w.user_id, w]))
  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  const now = Date.now()
  const subMap = Object.fromEntries(
    (subs ?? [])
      .filter(s => !s.expires_at || new Date(s.expires_at).getTime() > now)
      .map(s => [
        s.wedding_id,
        {
          name: (s.plans as unknown as { name: string } | null)?.name ?? 'Active',
          status: s.status,
          isTrial: (s.amount_paid ?? 0) === 0,
        },
      ])
  )

  const guestCount: Record<string, number> = {}
  for (const g of guestRows ?? []) {
    guestCount[g.wedding_id] = (guestCount[g.wedding_id] ?? 0) + 1
  }

  const rows: CustomerRow[] = users.map(u => {
    const w = weddingByUser[u.id]
    const p = profileMap[u.id]
    const sub = w ? subMap[w.id] : undefined
    return {
      userId: u.id,
      weddingId: w?.id ?? null,
      name: p ? `${p.bride_name} & ${p.groom_name}` : '—',
      email: u.email ?? '—',
      slug: w?.slug ?? null,
      emailVerified: !!u.email_confirmed_at,
      // Signup date, not setup or subscription date — these differ.
      signedUpAt: u.created_at,
      setupComplete: !!w,
      planName: sub?.name ?? null,
      isTrial: sub?.isTrial ?? false,
      subPaused: sub?.status === 'paused',
      guests: w ? (guestCount[w.id] ?? 0) : 0,
      rsvpEnabled: !!w?.rsvp_enabled,
    }
  })

  rows.sort((a, b) => new Date(b.signedUpAt).getTime() - new Date(a.signedUpAt).getTime())

  return <CustomersClient rows={rows} />
}
