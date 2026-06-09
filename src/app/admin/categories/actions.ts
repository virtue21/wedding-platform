'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type SubInput = { id: string; label: string }
export type CatInput = { id: string; label: string; subcategories: SubInput[] }

// Central save — called once when the user clicks "Save changes"
export async function saveCategories(
  side: 'bride' | 'groom',
  categories: CatInput[],
  deletedCategoryIds: string[],
  deletedSubIds: string[],
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wedding } = await supabase
    .from('weddings').select('id').eq('user_id', user.id).single()
  if (!wedding) return { error: 'No wedding found.' }

  // 1. Delete removed subcategories
  if (deletedSubIds.length > 0) {
    await supabase.from('relationship_subcategories').delete().in('id', deletedSubIds)
  }

  // 2. Delete removed categories — block if guests are assigned
  if (deletedCategoryIds.length > 0) {
    const { data: blockedGuests } = await supabase
      .from('guests')
      .select('id')
      .in('category_id', deletedCategoryIds)
      .eq('is_removed', false)
      .limit(1)

    if (blockedGuests && blockedGuests.length > 0) {
      return { error: 'One of the categories you removed still has guests assigned to it. Reassign those guests first.' }
    }
    await supabase.from('relationship_categories').delete().in('id', deletedCategoryIds)
  }

  // 3. Upsert categories + their subcategories in order
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i]
    const isNew = cat.id.startsWith('new:')
    let realCatId: string

    if (isNew) {
      const { data: inserted, error } = await supabase
        .from('relationship_categories')
        .insert({ wedding_id: wedding.id, side, label: cat.label.trim(), sort_order: i })
        .select('id')
        .single()
      if (error || !inserted) continue
      realCatId = inserted.id
    } else {
      await supabase
        .from('relationship_categories')
        .update({ label: cat.label.trim(), sort_order: i })
        .eq('id', cat.id)
      realCatId = cat.id
    }

    // Upsert subcategories
    for (let j = 0; j < cat.subcategories.length; j++) {
      const sub = cat.subcategories[j]
      if (sub.id.startsWith('new:')) {
        await supabase
          .from('relationship_subcategories')
          .insert({ category_id: realCatId, label: sub.label.trim(), sort_order: j })
      } else {
        await supabase
          .from('relationship_subcategories')
          .update({ label: sub.label.trim(), sort_order: j })
          .eq('id', sub.id)
      }
    }
  }

  revalidatePath('/admin/categories')
  revalidatePath('/admin/tables')
  return { success: true }
}
