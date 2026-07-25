import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * AI story illustrations are a Grand/Prestige feature
 * (plans.has_story_images). Unlocked for everyone only when
 * no plans are active in the system.
 */
export async function storyImagesEntitlement(weddingId: string): Promise<{ entitled: boolean }> {
  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ count: activePlanCount }, { data: sub }] = await Promise.all([
    sb.from('plans').select('id', { count: 'exact', head: true }).eq('is_active', true),
    sb.from('wedding_subscriptions')
      .select('plans(has_story_images)')
      .eq('wedding_id', weddingId)
      .eq('status', 'active')
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .limit(1)
      .single(),
  ])

  if ((activePlanCount ?? 0) === 0) return { entitled: true }
  const hasFlag = (sub as { plans?: { has_story_images?: boolean } } | null)?.plans?.has_story_images === true
  return { entitled: hasFlag }
}
