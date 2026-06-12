import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getWeddingPlanInfo } from '@/lib/plans'
import RsvpSettingsClient from './RsvpSettingsClient'
import SectionGuide from '@/components/SectionGuide'

function UsageRow({ label, used, cap }: { label: string; used: number; cap: number | null }) {
  if (cap === null) return (
    <div className="flex justify-between text-xs text-stone-500">
      <span>{label}</span><span className="text-emerald-500">{used} / Unlimited</span>
    </div>
  )
  const isFull = used >= cap
  const isWarning = used / cap >= 0.8
  return (
    <div className="flex justify-between text-xs">
      <span className="text-stone-500">{label}</span>
      <span className={isFull ? 'text-red-500 font-medium' : isWarning ? 'text-amber-500' : 'text-stone-400'}>
        {used}/{cap}
      </span>
    </div>
  )
}

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, rsvp_enabled, rsvp_limit')
    .eq('user_id', user.id)
    .single()
  if (!wedding) redirect('/setup')

  const [{ count }, planInfo] = await Promise.all([
    supabase
      .from('guests')
      .select('id', { count: 'exact' })
      .eq('wedding_id', wedding.id)
      .eq('is_removed', false),
    getWeddingPlanInfo(wedding.id),
  ])

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-stone-800 mb-1">Settings</h1>
        <p className="text-stone-400 text-sm">Control your wedding page features</p>
      </div>

      <SectionGuide
        icon="🔧"
        title="Control what guests can see"
        body="Use RSVP toggle to open or close attendance confirmation — turn it off once you've reached your headcount or after the RSVP deadline. Your plan controls how many guests, registry items, and tables you can have."
        tip="You can re-open RSVP at any time if you need to let a few more people in."
      />

      {/* Plan Summary */}
      <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-medium text-stone-800 mb-1">Current Plan</h2>
            {planInfo.isActive && planInfo.plan ? (
              <>
                <p className="text-sm text-stone-400">
                  You are on the <span className="font-medium text-stone-700">{planInfo.plan.name}</span> plan
                </p>
                <div className="mt-3 space-y-2">
                  <UsageRow label="Guests" used={planInfo.usage.guests} cap={planInfo.caps.guests} />
                  <UsageRow label="Registry Items" used={planInfo.usage.registryItems} cap={planInfo.caps.registryItems} />
                  <UsageRow label="Tables" used={planInfo.usage.tables} cap={planInfo.caps.tables} />
                </div>
              </>
            ) : (
              <p className="text-sm text-amber-500">No active plan — subscribe to unlock features</p>
            )}
          </div>
          <Link
            href="/admin/plans"
            className="px-4 py-2 border border-rose-200 text-rose-500 text-sm font-medium rounded-xl hover:border-rose-300 transition-colors shrink-0"
          >
            {planInfo.isActive ? 'Manage Plan' : 'Subscribe'}
          </Link>
        </div>
      </div>

      <RsvpSettingsClient
        weddingId={wedding.id}
        initialEnabled={wedding.rsvp_enabled ?? true}
        initialLimit={wedding.rsvp_limit ?? null}
        currentCount={count ?? 0}
        hasActivePlan={planInfo.isActive}
      />
    </div>
  )
}
