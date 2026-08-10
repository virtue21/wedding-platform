'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getWeddingPlanInfo } from '@/lib/plans'

export async function saveRsvpSettings(weddingId: string, enabled: boolean, limit: number | null, deadline: string | null) {
  const supabase = createClient()

  // The client already clamps to the plan's guest cap, but that's just UX —
  // enforce it here too so a direct call can't set a limit above what the
  // couple is actually paying for.
  let clampedLimit = limit
  if (limit !== null) {
    const { caps } = await getWeddingPlanInfo(weddingId)
    if (caps.guests !== null) clampedLimit = Math.min(limit, caps.guests)
  }

  await supabase.from('weddings').update({ rsvp_enabled: enabled, rsvp_limit: clampedLimit, rsvp_deadline: deadline }).eq('id', weddingId)
  revalidatePath('/admin/settings')
  revalidatePath('/admin')
}

export async function saveWishesVisibility(weddingId: string, isPublic: boolean) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('weddings').update({ wishes_public: isPublic }).eq('id', weddingId)
  revalidatePath('/admin/settings')
  revalidatePath('/admin/wall')
}
