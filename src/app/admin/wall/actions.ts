'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function deleteNote(id: string) {
  const supabase = createClient()
  await supabase.from('wedding_notes').delete().eq('id', id)
  revalidatePath('/admin/wall')
}

export async function deletePhoto(id: string) {
  const supabase = createClient()
  await supabase.from('wedding_photos').delete().eq('id', id)
  revalidatePath('/admin/wall')
}
