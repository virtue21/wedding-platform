import { createClient } from '@/lib/supabase/server'
import type { Plan, WeddingSubscription } from '@/lib/supabase/database.types'

export type PlanWithSubscription = {
  plan: Plan | null
  subscription: WeddingSubscription | null
  isActive: boolean
  usage: {
    guests: number
    registryItems: number
    tables: number
    moments: number
  }
  caps: {
    guests: number | null
    registryItems: number | null
    tables: number | null
    moments: number | null
  }
  atCap: {
    guests: boolean
    registryItems: boolean
    tables: boolean
    moments: boolean
  }
}

export async function getWeddingPlanInfo(weddingId: string): Promise<PlanWithSubscription> {
  const supabase = createClient()

  const [subResult, guestCount, registryCount, tableCount, momentCount] = await Promise.all([
    supabase.from('wedding_subscriptions').select('*, plan:plans(*)').eq('wedding_id', weddingId).eq('status', 'active').single(),
    supabase.from('guests').select('id', { count: 'exact' }).eq('wedding_id', weddingId).eq('is_removed', false),
    supabase.from('registry_items').select('id', { count: 'exact' }).eq('wedding_id', weddingId),
    supabase.from('seat_tables').select('id', { count: 'exact' }).eq('wedding_id', weddingId),
    supabase.from('wedding_photos').select('id', { count: 'exact' }).eq('wedding_id', weddingId),
  ])

  const subscription = subResult.data as (WeddingSubscription & { plan: Plan }) | null
  const plan = subscription?.plan ?? null

  const usage = {
    guests: guestCount.count ?? 0,
    registryItems: registryCount.count ?? 0,
    tables: tableCount.count ?? 0,
    moments: momentCount.count ?? 0,
  }

  const caps = {
    guests: plan?.guest_cap ?? null,
    registryItems: plan?.registry_item_cap ?? null,
    tables: plan?.table_cap ?? null,
    moments: plan?.moments_upload_cap ?? null,
  }

  const atCap = {
    guests: caps.guests !== null && usage.guests >= caps.guests,
    registryItems: caps.registryItems !== null && usage.registryItems >= caps.registryItems,
    tables: caps.tables !== null && usage.tables >= caps.tables,
    moments: caps.moments !== null && usage.moments >= caps.moments,
  }

  return {
    plan,
    subscription: subResult.data as WeddingSubscription | null,
    isActive: !!subscription,
    usage,
    caps,
    atCap,
  }
}

export function formatPrice(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}
