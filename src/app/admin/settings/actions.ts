'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveRsvpSettings(weddingId: string, enabled: boolean, limit: number | null, deadline: string | null) {
  const supabase = createClient()
  await supabase.from('weddings').update({ rsvp_enabled: enabled, rsvp_limit: limit, rsvp_deadline: deadline }).eq('id', weddingId)
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
