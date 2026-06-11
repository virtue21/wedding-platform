import { createClient as createServiceClient } from '@supabase/supabase-js'
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
      .eq('status', 'active'),
    sb.from('guests')
      .select('wedding_id')
      .eq('is_removed', false),
  ])

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  const subMap = Object.fromEntries(
    (subs ?? []).map(s => [s.wedding_id, (s.plans as unknown as { name: string } | null)?.name ?? 'Active'])
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
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Slug</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Plan</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Guests</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">RSVP</th>
              <th className="text-left text-stone-400 text-xs font-medium px-5 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(weddings ?? []).map(w => {
              const p = profileMap[w.user_id]
              const name = p ? `${p.bride_name} & ${p.groom_name}` : '—'
              const plan = subMap[w.id]
              return (
                <tr key={w.id} className="border-b border-stone-800/50 hover:bg-stone-800/30 transition-colors">
                  <td className="px-5 py-3.5 text-white font-medium">{name}</td>
                  <td className="px-5 py-3.5 text-stone-400">/{w.slug}</td>
                  <td className="px-5 py-3.5">
                    {plan ? (
                      <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-xs rounded-full">{plan}</span>
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
                </tr>
              )
            })}
          </tbody>
        </table>
        {(weddings ?? []).length === 0 && (
          <div className="text-center py-12 text-stone-500 text-sm">No customers yet</div>
        )}
      </div>
    </div>
  )
}
