import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * Reads through the service role because user_profiles is owner-only
 * under RLS ("Users can view own profile"), but the couple's names are
 * shown on every guest-facing page — an anonymous guest's request has no
 * auth.uid() to satisfy that policy, so the request-scoped client always
 * silently returned null there. That was masked for a long time by page
 * caching (a cached render from the couple's own authenticated visit kept
 * serving to guests); force-dynamic rendering exposed it for what it was.
 * Server-side only; never import into a client component.
 */
function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function getCoupleNames(userId: string): Promise<{ brideName: string; groomName: string }> {
  const { data } = await serviceClient()
    .from('user_profiles')
    .select('bride_name, groom_name')
    .eq('id', userId)
    .single()

  return {
    brideName: data?.bride_name ?? 'Bride',
    groomName: data?.groom_name ?? 'Groom',
  }
}
