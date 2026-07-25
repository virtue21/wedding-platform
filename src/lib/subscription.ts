import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * Entitlement reads run through the service role because
 * wedding_subscriptions is owner-only under RLS — guest-facing pages are
 * anonymous and would otherwise see every wedding as unsubscribed.
 * Server-side only; never import into a client component.
 */
function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export type WeddingEntitlements = {
  /** An active, unexpired subscription exists (or no plans are active at all). */
  subActive: boolean
  hasMoments: boolean
  /** null = unlimited, 0 = blocked. */
  momentsCap: number | null
  /** null = unlimited. */
  guestCap: number | null
}

export async function getWeddingEntitlements(weddingId: string): Promise<WeddingEntitlements> {
  const sb = serviceClient()

  const [{ count: activePlanCount }, { data: sub }] = await Promise.all([
    sb.from('plans').select('id', { count: 'exact', head: true }).eq('is_active', true),
    sb.from('wedding_subscriptions')
      .select('plan_id, plans(has_moments, moments_upload_cap, guest_cap)')
      .eq('wedding_id', weddingId)
      .eq('status', 'active')
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .limit(1)
      .maybeSingle(),
  ])

  // No plans configured at all → unlock everything (dev / pre-launch mode)
  if ((activePlanCount ?? 0) === 0) {
    return { subActive: true, hasMoments: true, momentsCap: null, guestCap: null }
  }

  const plan = (sub as {
    plans?: { has_moments?: boolean; moments_upload_cap?: number | null; guest_cap?: number | null }
  } | null)?.plans
  const subActive = sub !== null
  const hasMoments = plan?.has_moments === true

  return {
    subActive,
    hasMoments,
    momentsCap: hasMoments ? (plan?.moments_upload_cap ?? null) : 0,
    guestCap: plan?.guest_cap ?? null,
  }
}

/** Convenience wrapper for the common "can guests RSVP?" check. */
export async function isSubscriptionActive(weddingId: string): Promise<boolean> {
  return (await getWeddingEntitlements(weddingId)).subActive
}
