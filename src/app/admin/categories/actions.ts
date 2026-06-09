'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { RelationshipCategory, RelationshipSubcategory } from '@/lib/supabase/database.types'

export type SubInput = { id: string; label: string }
export type CatInput = { id: string; label: string; subcategories: SubInput[] }

type CategoryWithSubs = RelationshipCategory & { subcategories: RelationshipSubcategory[] }

// Save one side to DB and return the freshly-queried result
async function saveSide(
  supabase: ReturnType<typeof createClient>,
  weddingId: string,
  side: 'bride' | 'groom',
  categories: CatInput[],
  deletedCategoryIds: string[],
  deletedSubIds: string[],
): Promise<{ error?: string }> {

  // 1. Delete removed subcategories
  if (deletedSubIds.length > 0) {
    const { error } = await supabase
      .from('relationship_subcategories')
      .delete()
      .in('id', deletedSubIds)
    if (error) return { error: `Failed to delete sub-categories: ${error.message}` }
  }

  // 2. Delete removed categories (block if guests still assigned)
  if (deletedCategoryIds.length > 0) {
    const { data: blocked } = await supabase
      .from('guests')
      .select('id')
      .in('category_id', deletedCategoryIds)
      .eq('is_removed', false)
      .limit(1)

    if (blocked && blocked.length > 0) {
      return { error: 'One of the categories you removed still has guests assigned. Reassign those guests first.' }
    }

    const { error } = await supabase
      .from('relationship_categories')
      .delete()
      .in('id', deletedCategoryIds)
    if (error) return { error: `Failed to delete categories: ${error.message}` }
  }

  // 3. Upsert categories + subcategories in order
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i]
    let realCatId: string

    if (cat.id.startsWith('new:')) {
      const { data: inserted, error } = await supabase
        .from('relationship_categories')
        .insert({ wedding_id: weddingId, side, label: cat.label.trim(), sort_order: i })
        .select('id')
        .single()
      if (error || !inserted) {
        return { error: `Failed to create category "${cat.label}": ${error?.message}` }
      }
      realCatId = inserted.id
    } else {
      const { error } = await supabase
        .from('relationship_categories')
        .update({ label: cat.label.trim(), sort_order: i })
        .eq('id', cat.id)
      if (error) return { error: `Failed to update category "${cat.label}": ${error.message}` }
      realCatId = cat.id
    }

    // Upsert subcategories
    for (let j = 0; j < cat.subcategories.length; j++) {
      const sub = cat.subcategories[j]
      if (sub.id.startsWith('new:')) {
        const { error } = await supabase
          .from('relationship_subcategories')
          .insert({ category_id: realCatId, label: sub.label.trim(), sort_order: j })
        if (error) {
          return { error: `Failed to create sub-category "${sub.label}": ${error.message}` }
        }
      } else {
        const { error } = await supabase
          .from('relationship_subcategories')
          .update({ label: sub.label.trim(), sort_order: j })
          .eq('id', sub.id)
        if (error) {
          return { error: `Failed to update sub-category "${sub.label}": ${error.message}` }
        }
      }
    }
  }

  return {}
}

// Central save — both sides at once
// Returns fresh data from DB so the client can reset its local state
export async function saveCategories(
  brideCategories: CatInput[],
  groomCategories: CatInput[],
  deletedBrideCatIds: string[],
  deletedGroomCatIds: string[],
  deletedSubIds: string[],
): Promise<{
  error?: string
  bride?: CategoryWithSubs[]
  groom?: CategoryWithSubs[]
}> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wedding } = await supabase
    .from('weddings').select('id').eq('user_id', user.id).single()
  if (!wedding) return { error: 'No wedding found.' }

  // Save bride side
  const brideResult = await saveSide(
    supabase, wedding.id, 'bride',
    brideCategories, deletedBrideCatIds, deletedSubIds,
  )
  if (brideResult.error) return { error: brideResult.error }

  // Save groom side
  const groomResult = await saveSide(
    supabase, wedding.id, 'groom',
    groomCategories, deletedGroomCatIds, deletedSubIds,
  )
  if (groomResult.error) return { error: groomResult.error }

  // Re-query fresh data so the client can reset local state with real IDs
  const { data: fresh } = await supabase
    .from('relationship_categories')
    .select('*, relationship_subcategories(id, category_id, label, sort_order)')
    .eq('wedding_id', wedding.id)
    .order('sort_order') as { data: CategoryWithSubs[] | null }

  const all = (fresh ?? []).map(c => ({
    ...c,
    subcategories: [...(c.subcategories ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  }))

  revalidatePath('/admin/categories')
  revalidatePath('/admin/tables')

  return {
    bride: all.filter(c => c.side === 'bride'),
    groom: all.filter(c => c.side === 'groom'),
  }
}
