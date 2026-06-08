'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function addCategory(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wedding } = await supabase.from('weddings').select('id').eq('user_id', user.id).single()
  if (!wedding) return

  const side = formData.get('side') as 'bride' | 'groom'
  const label = (formData.get('label') as string).trim()
  if (!label) return

  const { data: existing } = await supabase
    .from('relationship_categories')
    .select('sort_order')
    .eq('wedding_id', wedding.id)
    .eq('side', side)
    .order('sort_order', { ascending: false })
    .limit(1)

  const sort_order = (existing?.[0]?.sort_order ?? -1) + 1
  await supabase.from('relationship_categories').insert({ wedding_id: wedding.id, side, label, sort_order })
  revalidatePath('/admin/categories')
}

export async function deleteCategory(id: string) {
  const supabase = createClient()
  await supabase.from('relationship_categories').delete().eq('id', id)
  revalidatePath('/admin/categories')
}

export async function renameCategory(id: string, label: string) {
  const supabase = createClient()
  await supabase.from('relationship_categories').update({ label }).eq('id', id)
  revalidatePath('/admin/categories')
}

export async function addSubcategory(categoryId: string, label: string) {
  const supabase = createClient()
  const { data: existing } = await supabase
    .from('relationship_subcategories')
    .select('sort_order')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const sort_order = (existing?.[0]?.sort_order ?? -1) + 1
  await supabase.from('relationship_subcategories').insert({ category_id: categoryId, label, sort_order })
  revalidatePath('/admin/categories')
}

export async function deleteSubcategory(id: string) {
  const supabase = createClient()
  await supabase.from('relationship_subcategories').delete().eq('id', id)
  revalidatePath('/admin/categories')
}

export async function renameSubcategory(id: string, label: string) {
  const supabase = createClient()
  await supabase.from('relationship_subcategories').update({ label }).eq('id', id)
  revalidatePath('/admin/categories')
}
