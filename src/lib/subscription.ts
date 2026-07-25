import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

/**
 * True when the wedding has an active, unexpired subscription —
 * or when no plans are active in the system (dev/no-plan mode).
 */
export async function isSubscriptionActive(
  sb: SupabaseClient<Database>,
  weddingId: string
): Promise<boolean> {
  const [{ count: activePlanCount }, { data: sub }] = await Promise.all([
    sb.from('plans').select('id', { count: 'exact', head: true }).eq('is_active', true),
    sb.from('wedding_subscriptions')
      .select('id')
      .eq('wedding_id', weddingId)
      .eq('status', 'active')
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .limit(1)
      .maybeSingle(),
  ])
  if ((activePlanCount ?? 0) === 0) return true
  return sub !== null
}
