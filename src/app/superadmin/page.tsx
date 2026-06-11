import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

function serviceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function formatCurrency(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export default async function SuperadminDashboard() {
  const sb = serviceClient()

  const [
    { count: totalCustomers },
    { data: subs },
    { data: recentWeddings },
    { data: planBreakdown },
  ] = await Promise.all([
    sb.from('weddings').select('*', { count: 'exact', head: true }),
    sb.from('wedding_subscriptions')
      .select('status, amount_paid, plans(name)')
      .neq('status', 'pending'),
    sb.from('weddings')
      .select('id, slug, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(8),
    sb.from('wedding_subscriptions')
      .select('status, plans(name)')
      .eq('status', 'active'),
  ])

  const activeSubs = subs?.filter(s => s.status === 'active') ?? []
  const payingCustomers = activeSubs.length

  const totalRevenue = (subs ?? []).reduce((sum, s) => {
    const paid = typeof s.amount_paid === 'number' ? s.amount_paid : 0
    return sum + paid
  }, 0)

  // Plan distribution
  const planCounts: Record<string, number> = {}
  for (const sub of planBreakdown ?? []) {
    const planName = (sub.plans as unknown as { name: string } | null)?.name ?? 'Unknown'
    planCounts[planName] = (planCounts[planName] ?? 0) + 1
  }

  // Profile names for recent weddings
  const userIds = Array.from(new Set((recentWeddings ?? []).map(w => w.user_id)))
  const { data: profiles } = userIds.length
    ? await sb.from('user_profiles').select('id, bride_name, groom_name').in('id', userIds)
    : { data: [] }
  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  const kpis = [
    {
      label: 'Total Customers',
      value: totalCustomers ?? 0,
      icon: '👥',
      sub: 'couples signed up',
    },
    {
      label: 'Paying Customers',
      value: payingCustomers,
      icon: '💳',
      sub: 'active subscriptions',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: '💰',
      sub: 'all time',
    },
    {
      label: 'Conversion Rate',
      value: totalCustomers ? `${Math.round((payingCustomers / totalCustomers) * 100)}%` : '0%',
      icon: '📈',
      sub: 'free → paid',
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-white text-2xl font-semibold">Dashboard</h1>
        <p className="text-stone-400 text-sm mt-1">Platform overview across all customers</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-stone-400 text-xs font-medium uppercase tracking-wide">{kpi.label}</p>
              <span className="text-lg">{kpi.icon}</span>
            </div>
            <p className="text-white text-3xl font-bold">{kpi.value}</p>
            <p className="text-stone-500 text-xs mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent signups */}
        <div className="xl:col-span-2 bg-stone-900 border border-stone-800 rounded-2xl p-5">
          <h2 className="text-white text-sm font-semibold mb-4">Recent Customers</h2>
          {(recentWeddings ?? []).length === 0 ? (
            <p className="text-stone-500 text-sm">No customers yet</p>
          ) : (
            <div className="space-y-1">
              {(recentWeddings ?? []).map(w => {
                const profile = profileMap[w.user_id]
                const name = profile
                  ? `${profile.bride_name} & ${profile.groom_name}`
                  : w.slug
                return (
                  <div key={w.id} className="flex items-center justify-between py-2.5 border-b border-stone-800 last:border-0">
                    <div>
                      <p className="text-white text-sm font-medium">{name}</p>
                      <p className="text-stone-500 text-xs">/{w.slug}</p>
                    </div>
                    <span className="text-stone-400 text-xs">{timeAgo(w.created_at)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Plan distribution */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
          <h2 className="text-white text-sm font-semibold mb-4">Plan Distribution</h2>
          {Object.keys(planCounts).length === 0 ? (
            <p className="text-stone-500 text-sm">No active plans</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(planCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([plan, count]) => (
                  <div key={plan}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-stone-300">{plan}</span>
                      <span className="text-stone-400">{count}</span>
                    </div>
                    <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${Math.max(8, (count / payingCustomers) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-stone-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-stone-500">Free tier</span>
              <span className="text-stone-400">{(totalCustomers ?? 0) - payingCustomers}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-stone-500">Paid</span>
              <span className="text-rose-400 font-medium">{payingCustomers}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
