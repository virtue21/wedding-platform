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

export async function addGuest(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const { data: wedding } = await supabase
    .from('weddings').select('id').eq('user_id', user.id).single()
  if (!wedding) return { ok: false, error: 'Wedding not found.' }

  const full_name = (formData.get('full_name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim()
  const email = ((formData.get('email') as string) || '').trim().toLowerCase() || null
  const side = formData.get('side') as 'bride' | 'groom' | 'both'
  const category_id = (formData.get('category_id') as string) || ''

  if (!full_name || !phone || !side) {
    return { ok: false, error: 'Name, phone, and side are required.' }
  }
  if (!category_id) {
    return { ok: false, error: 'Please choose a category — set them up under Categories if you have none yet.' }
  }

  // Duplicate phone check (same rule as guest RSVP)
  const { data: dup } = await supabase
    .from('guests')
    .select('id')
    .eq('wedding_id', wedding.id)
    .eq('phone', phone)
    .eq('is_removed', false)
    .maybeSingle()
  if (dup) return { ok: false, error: 'A guest with this phone number already exists.' }

  const { error } = await supabase.from('guests').insert({
    wedding_id: wedding.id,
    full_name,
    phone,
    email,
    side,
    category_id,
    rsvp_date: new Date().toISOString(),
  })
  if (error) return { ok: false, error: 'Could not add guest. Please try again.' }

  revalidatePath('/admin/guests')
  return { ok: true }
}
