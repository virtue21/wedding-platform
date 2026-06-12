import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import SubscriptionsClient from './SubscriptionsClient'

function serviceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function SubscriptionsPage() {
  const sb = serviceClient()

  const { data: subs } = await sb
    .from('wedding_subscriptions')
    .select('*, plans(name, price)')
    .order('created_at', { ascending: false })

  const weddingIds = Array.from(new Set((subs ?? []).map(s => s.wedding_id)))
  const { data: weddings } = weddingIds.length
    ? await sb.from('weddings').select('id, slug, user_id').in('id', weddingIds)
    : { data: [] }

  const userIds = Array.from(new Set((weddings ?? []).map(w => w.user_id)))
  const { data: profiles } = userIds.length
    ? await sb.from('user_profiles').select('id, bride_name, groom_name').in('id', userIds)
    : { data: [] }

  const weddingMap = Object.fromEntries((weddings ?? []).map(w => [w.id, w]))
  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  const enriched = (subs ?? []).map(s => {
    const wedding = weddingMap[s.wedding_id]
    const profile = wedding ? profileMap[wedding.user_id] : null
    const coupleName = profile ? `${profile.bride_name} & ${profile.groom_name}` : wedding?.slug ?? '—'
    const planName = (s.plans as unknown as { name: string; price: number } | null)?.name ?? '—'
    return { ...s, coupleName, planName, slug: wedding?.slug ?? '' }
  })

  return <SubscriptionsClient subs={enriched} />
}
