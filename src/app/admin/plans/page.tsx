import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getWeddingPlanInfo } from '@/lib/plans'
import PlansClient from './PlansClient'
import type { Plan } from '@/lib/supabase/database.types'

export default async function PlansPage({ searchParams }: { searchParams: { success?: string; error?: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wedding } = await supabase.from('weddings').select('id').eq('user_id', user.id).single()
  if (!wedding) redirect('/setup')

  const [plansResult, planInfo] = await Promise.all([
    supabase.from('plans').select('*').eq('is_active', true).order('sort_order'),
    getWeddingPlanInfo(wedding.id),
  ])

  const plans = (plansResult.data ?? []) as Plan[]

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-stone-800 mb-1">Plans</h1>
        <p className="text-stone-400 text-sm">Choose a plan that fits your wedding size</p>
      </div>

      {searchParams.success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm text-emerald-700 flex items-center gap-2">
          🎉 Subscription activated! Your features are now unlocked.
        </div>
      )}
      {searchParams.error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600">
          Payment failed or was cancelled. Please try again.
        </div>
      )}

      <PlansClient plans={plans} planInfo={planInfo} weddingId={wedding.id} />
    </div>
  )
}
