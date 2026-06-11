'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function togglePlan(id: string, isActive: boolean) {
  const supabase = createClient()
  await supabase.from('plans').update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/superadmin/plans')
  revalidatePath('/admin/plans')
}

export async function updatePlan(id: string, data: {
  name: string
  price: number
  guest_cap: number | null
  registry_item_cap: number | null
  table_cap: number | null
  has_moments: boolean
  moments_upload_cap: number | null
}) {
  const supabase = createClient()
  await supabase.from('plans').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/superadmin/plans')
  revalidatePath('/admin/plans')
}
