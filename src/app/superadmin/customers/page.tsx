import { createClient as createServiceClient } from '@supabase/supabase-js'
import Link from 'next/link'
import type { Database } from '@/lib/supabase/database.types'

function serviceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function CustomersPage() {
  const sb = serviceClient()

  const { data: weddings } = await sb
    .from('weddings')
    .select('id, slug, created_at, user_id, rsvp_enabled')
    .order('created_at', { ascending: false })

  const userIds = Array.from(new Set((weddings ?? []).map(w => w.user_id)))

  const [
    { data: profiles },
    { data: subs },
    { data: guestCounts },
  ] = await Promise.all([
    userIds.length
      ? sb.from('user_profiles').select('id, bride_name, groom_name').in('id', userIds)
      : Promise.resolve({ data: [] }),
    sb.from('wedding_subscriptions')
      .select('wedding_id, status, plans(name)')
      .in('status', ['active', 'paused']),
    sb.from('guests')
      .select('wedding_id')
      .eq('is_removed', false),
  ])

  // All auth users, so we can spot people who signed up but never
  // completed Setup — they have no weddings row, so they'd otherwise be
  // invisible here.
  const { data: authList } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const allUsers = authList?.users ?? []

  const emailMap: Record<string, string> = {}
  for (const u of allUsers) {
    if (u.email) emailMap[u.id] = u.email
  }

  const weddingUserIds = new Set(userIds)
  const incompleteUsers = allUsers.filter(u => !weddingUserIds.has(u.id))

  // Names for incomplete signups (profile is created at signup, wedding isn't)
  const { data: incompleteProfiles } = incompleteUsers.length
    ? await sb.from('user_profiles')
        .select('id, bride_name, groom_name')
        .in('id', incompleteUsers.map(u => u.id))
    : { data: [] }
  const incompleteProfileMap = Object.fromEntries(
    (incompleteProfiles ?? []).map(p => [p.id, p])
  )

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  const subMap = Object.fromEntries(
    (subs ?? []).map(s => [
      s.wedding_id,
      { name: (s.plans as unknown as { name: string } | null)?.name ?? 'Active', status: s.status },
    ])
  )
  const guestCountMap: Record<string, number> = {}
  for (const g of guestCounts ?? []) {
    guestCountMap[g.wedding_id] = (guestCountMap[g.wedding_id] ?? 0) + 1
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-white text-2xl font-semibold">Customers</h1>
        <p className="text-stone-400 text-sm mt-1">{(weddings ?? []).length} couples on the platform</p>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-800">
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Customer</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Email</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Plan</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Guests</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">RSVP</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Joined</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {(weddings ?? []).map(w => {
              const p = profileMap[w.user_id]
              const name = p ? `${p.bride_name} & ${p.groom_name}` : '—'
              const sub = subMap[w.id]
              const email = emailMap[w.user_id] ?? '—'
              return (
                <tr key={w.id} className="border-b border-stone-800/50 hover:bg-stone-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-white font-medium">{name}</p>
                    <p className="text-stone-500 text-xs mt-0.5">/{w.slug}</p>
                  </td>
                  <td className="px-5 py-3.5 text-stone-400 text-xs">{email}</td>
                  <td className="px-5 py-3.5">
                    {sub ? (
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${sub.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {sub.status === 'paused' ? `${sub.name} (Paused)` : sub.name}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-stone-800 text-stone-500 text-xs rounded-full">Free</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-stone-300">{guestCountMap[w.id] ?? 0}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${w.rsvp_enabled ? 'bg-green-500/20 text-green-400' : 'bg-stone-800 text-stone-500'}`}>
                      {w.rsvp_enabled ? 'Open' : 'Closed'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-stone-400 text-xs">{formatDate(w.created_at)}</td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/superadmin/customers/${w.id}`}
                      className="px-3 py-1.5 text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors whitespace-nowrap"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {(weddings ?? []).length === 0 && (
          <div className="text-center py-12 text-stone-500 text-sm">No customers yet</div>
        )}
      </div>

      {/* Signed up but never completed Setup — no weddings row exists yet */}
      {incompleteUsers.length > 0 && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-800">
            <h2 className="text-white text-sm font-semibold">
              Signed up — setup not completed
              <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                {incompleteUsers.length}
              </span>
            </h2>
            <p className="text-stone-500 text-xs mt-1">
              Accounts created but no wedding details saved yet — they can&apos;t share a link or take RSVPs.
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-800">
                <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Name</th>
                <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Email</th>
                <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Email verified</th>
                <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Signed up</th>
              </tr>
            </thead>
            <tbody>
              {incompleteUsers.map(u => {
                const p = incompleteProfileMap[u.id]
                const name = p ? `${p.bride_name} & ${p.groom_name}` : '—'
                return (
                  <tr key={u.id} className="border-b border-stone-800/50">
                    <td className="px-5 py-3.5 text-stone-200">{name}</td>
                    <td className="px-5 py-3.5 text-stone-400 text-xs">{u.email ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        u.email_confirmed_at
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-stone-800 text-stone-500'
                      }`}>
                        {u.email_confirmed_at ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-stone-400 text-xs">{formatDate(u.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
