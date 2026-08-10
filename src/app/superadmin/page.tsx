import Link from 'next/link'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import DashboardDateFilter from './DashboardDateFilter'

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

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

const RANGE_LABEL: Record<string, string> = {
  today: 'today',
  '7d': 'in the last 7 days',
  '30d': 'in the last 30 days',
  all: 'all time',
  custom: 'in the selected range',
}

export default async function SuperadminDashboard({
  searchParams,
}: {
  searchParams: { range?: string; from?: string; to?: string }
}) {
  const sb = serviceClient()

  const range = searchParams.range ?? 'today'
  const now = new Date()
  let from: Date | null = null
  let to: Date | null = null

  if (range === 'today') {
    from = startOfDay(now)
  } else if (range === '7d') {
    from = startOfDay(new Date(now.getTime() - 6 * 86400000))
  } else if (range === '30d') {
    from = startOfDay(new Date(now.getTime() - 29 * 86400000))
  } else if (range === 'custom') {
    from = searchParams.from ? startOfDay(new Date(searchParams.from)) : null
    to = searchParams.to ? new Date(new Date(searchParams.to).getTime() + 86400000) : null
  }
  // range === 'all' leaves from/to null — no bound applied

  const fromIso = from?.toISOString() ?? null
  const toIso = to?.toISOString() ?? null

  let totalCustomersQuery = sb.from('weddings').select('*', { count: 'exact', head: true })
  if (fromIso) totalCustomersQuery = totalCustomersQuery.gte('created_at', fromIso)
  if (toIso) totalCustomersQuery = totalCustomersQuery.lt('created_at', toIso)

  let subsQuery = sb.from('wedding_subscriptions').select('status, amount_paid, plans(name)').neq('status', 'pending')
  if (fromIso) subsQuery = subsQuery.gte('activated_at', fromIso)
  if (toIso) subsQuery = subsQuery.lt('activated_at', toIso)

  let recentWeddingsQuery = sb.from('weddings').select('id, slug, created_at, user_id').order('created_at', { ascending: false })
  if (fromIso) recentWeddingsQuery = recentWeddingsQuery.gte('created_at', fromIso)
  if (toIso) recentWeddingsQuery = recentWeddingsQuery.lt('created_at', toIso)

  let planBreakdownQuery = sb.from('wedding_subscriptions').select('status, plans(name)').eq('status', 'active')
  if (fromIso) planBreakdownQuery = planBreakdownQuery.gte('activated_at', fromIso)
  if (toIso) planBreakdownQuery = planBreakdownQuery.lt('activated_at', toIso)

  const [
    { count: totalCustomers },
    { data: subs },
    { data: recentWeddings },
    { data: planBreakdown },
  ] = await Promise.all([
    totalCustomersQuery,
    subsQuery,
    recentWeddingsQuery.limit(8),
    planBreakdownQuery,
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

  // Signups that never reached Setup have no weddings row, so they're
  // missing from every count that starts from weddings.
  const { data: authList } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const signupsInRange = (authList?.users ?? []).filter(u => {
    const at = new Date(u.created_at)
    if (fromIso && at < new Date(fromIso)) return false
    if (toIso && at >= new Date(toIso)) return false
    return true
  })
  const totalSignups = signupsInRange.length
  const incompleteSetup = Math.max(0, totalSignups - (totalCustomers ?? 0))

  const periodLabel = RANGE_LABEL[range] ?? 'today'

  const kpis = [
    {
      label: 'Total Customers',
      value: totalCustomers ?? 0,
      icon: '👥',
      sub: incompleteSetup > 0
        ? `${incompleteSetup} more signed up, not set up`
        : `couples set up ${periodLabel}`,
    },
    {
      label: 'Paying Customers',
      value: payingCustomers,
      icon: '💳',
      sub: `active subscriptions ${periodLabel}`,
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: '💰',
      sub: periodLabel,
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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white text-2xl font-semibold">Dashboard</h1>
          <p className="text-stone-400 text-sm mt-1">Platform overview across all customers</p>
        </div>
        <DashboardDateFilter />
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
            <p className="text-stone-500 text-sm">No customers {periodLabel}</p>
          ) : (
            <div className="space-y-1">
              {(recentWeddings ?? []).map(w => {
                const profile = profileMap[w.user_id]
                const name = profile
                  ? `${profile.bride_name} & ${profile.groom_name}`
                  : w.slug
                return (
                  <Link
                    key={w.id}
                    href={`/superadmin/customers/${w.id}`}
                    className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg border-b border-stone-800 last:border-0 hover:bg-stone-800/60 transition-colors group"
                  >
                    <div>
                      <p className="text-white text-sm font-medium group-hover:text-rose-400 transition-colors">{name}</p>
                      <p className="text-stone-500 text-xs">/{w.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400 text-xs">{timeAgo(w.created_at)}</span>
                      <span className="text-stone-600 group-hover:text-rose-400 transition-colors">›</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Plan distribution */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
          <h2 className="text-white text-sm font-semibold mb-4">Plan Distribution</h2>
          {Object.keys(planCounts).length === 0 ? (
            <p className="text-stone-500 text-sm">No active plans {periodLabel}</p>
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
