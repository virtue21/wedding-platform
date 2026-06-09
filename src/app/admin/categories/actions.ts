'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { RelationshipCategory, RelationshipSubcategory } from '@/lib/supabase/database.types'

export type SubInput = { id: string; label: string }
export type CatInput = { id: string; label: string; subcategories: SubInput[] }

type CategoryWithSubs = RelationshipCategory & { subcategories: RelationshipSubcategory[] }

export async function saveCategories(
  brideCategories: CatInput[],
  groomCategories: CatInput[],
  deletedBrideCatIds: string[],
  deletedGroomCatIds: string[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _deletedSubIds: string[], // no longer needed — we replace all subs per category
): Promise<{
  error?: string
  debug?: string
  bride?: CategoryWithSubs[]
  groom?: CategoryWithSubs[]
}> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wedding } = await supabase
    .from('weddings').select('id').eq('user_id', user.id).single()
  if (!wedding) return { error: 'No wedding found.' }

  const allCategories = [
    ...brideCategories.map(c => ({ ...c, side: 'bride' as const })),
    ...groomCategories.map(c => ({ ...c, side: 'groom' as const })),
  ]

  const deletedCatIds = [...deletedBrideCatIds, ...deletedGroomCatIds]

  // ── 1. Block delete if guests are still assigned ──────────────────────────
  if (deletedCatIds.length > 0) {
    const { data: blocked } = await supabase
      .from('guests')
      .select('id')
      .in('category_id', deletedCatIds)
      .eq('is_removed', false)
      .limit(1)

    if (blocked && blocked.length > 0) {
      return { error: 'One of the deleted categories still has guests assigned. Reassign those guests first.' }
    }

    const { error } = await supabase
      .from('relationship_categories')
      .delete()
      .in('id', deletedCatIds)
    if (error) return { error: `Could not delete categories: ${error.message}` }
  }

  // ── 2. Upsert every category, then replace its subcategories ──────────────
  for (let i = 0; i < allCategories.length; i++) {
    const cat = allCategories[i]
    let realCatId: string

    if (cat.id.startsWith('new:')) {
      // Insert new category
      const { data: inserted, error } = await supabase
        .from('relationship_categories')
        .insert({ wedding_id: wedding.id, side: cat.side, label: cat.label.trim(), sort_order: i })
        .select('id')
        .single()

      if (error || !inserted) {
        return { error: `Could not create category "${cat.label}": ${error?.message ?? 'unknown error'}` }
      }
      realCatId = inserted.id
    } else {
      // Update existing category
      const { error } = await supabase
        .from('relationship_categories')
        .update({ label: cat.label.trim(), sort_order: i })
        .eq('id', cat.id)
        .eq('wedding_id', wedding.id) // extra safety

      if (error) return { error: `Could not update category "${cat.label}": ${error.message}` }
      realCatId = cat.id
    }

    // ── Replace subcategories: delete all then insert current set ──
    // This is simpler and more reliable than tracking new vs existing IDs.
    const { error: delErr } = await supabase
      .from('relationship_subcategories')
      .delete()
      .eq('category_id', realCatId)

    if (delErr) {
      return { error: `Could not clear sub-categories for "${cat.label}": ${delErr.message}` }
    }

    if (cat.subcategories.length > 0) {
      const rows = cat.subcategories.map((s, j) => ({
        category_id: realCatId,
        label: s.label.trim(),
        sort_order: j,
      }))

      const { error: insErr } = await supabase
        .from('relationship_subcategories')
        .insert(rows)

      if (insErr) {
        return { error: `Could not save sub-categories for "${cat.label}": ${insErr.message}` }
      }
    }
  }

  // ── 3. Re-query and return fresh data ─────────────────────────────────────
  const { data: fresh, error: fetchErr } = await supabase
    .from('relationship_categories')
    .select('*, relationship_subcategories(id, category_id, label, sort_order)')
    .eq('wedding_id', wedding.id)
    .order('sort_order') as { data: CategoryWithSubs[] | null; error: unknown }

  if (fetchErr) {
    return { error: `Saved OK but could not reload: ${JSON.stringify(fetchErr)}` }
  }

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
