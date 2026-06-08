'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function saveTable(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wedding } = await supabase.from('weddings').select('id').eq('user_id', user.id).single()
  if (!wedding) return

  const id = formData.get('id') as string | null
  const label = formData.get('label') as string
  const capacity = parseInt(formData.get('capacity') as string)
  const sort_order = parseInt(formData.get('sort_order') as string) || 0
  const category_id = (formData.get('category_id') as string) || null
  const subcategory_id = (formData.get('subcategory_id') as string) || null

  if (id) {
    await supabase.from('seat_tables').update({ label, capacity }).eq('id', id)
  } else {
    await supabase.from('seat_tables').insert({ wedding_id: wedding.id, label, capacity, sort_order, category_id, subcategory_id })
  }
  revalidatePath('/admin/tables')
}

export async function deleteTable(id: string) {
  const supabase = createClient()
  await supabase.from('seat_tables').delete().eq('id', id)
  revalidatePath('/admin/tables')
}

export async function assignGuestToTable(guestId: string, tableId: string | null) {
  const supabase = createClient()
  await supabase.from('guests').update({ table_id: tableId }).eq('id', guestId)
  revalidatePath('/admin/tables')
}
