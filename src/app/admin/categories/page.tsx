import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CategoriesClient from './CategoriesClient'
import type { RelationshipCategory, RelationshipSubcategory } from '@/lib/supabase/database.types'

type CategoryWithSubs = RelationshipCategory & { subcategories: RelationshipSubcategory[] }

export default async function CategoriesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wedding } = await supabase.from('weddings').select('id').eq('user_id', user.id).single()

  const { data: categories } = await supabase
    .from('relationship_categories')
    .select('*, subcategories:relationship_subcategories(id, category_id, label, sort_order)')
    .eq('wedding_id', wedding?.id ?? '')
    .order('sort_order') as { data: CategoryWithSubs[] | null }

  const all = (categories ?? []).map(c => ({
    ...c,
    subcategories: (c.subcategories ?? []).sort((a, b) => a.sort_order - b.sort_order),
  }))

  const bride = all.filter(c => c.side === 'bride')
  const groom = all.filter(c => c.side === 'groom')

  return <CategoriesClient bride={bride} groom={groom} />
}
