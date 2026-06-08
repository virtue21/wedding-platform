'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function removeGuest(guestId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('guests')
    .update({ is_removed: true })
    .eq('id', guestId)

  revalidatePath('/admin/guests')
}

export async function saveGuestNotes(guestId: string, notes: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('guests')
    .update({ notes })
    .eq('id', guestId)

  revalidatePath('/admin/guests')
}

export async function exportGuests() {
  redirect('/admin/guests/export')
}
