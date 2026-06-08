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
    .select('*, relationship_subcategories(id, category_id, label, sort_order)')
    .eq('wedding_id', wedding?.id ?? '')
    .order('sort_order') as { data: CategoryWithSubs[] | null }

  const all = (categories ?? []).map(c => ({
    ...c,
    subcategories: (c.subcategories ?? []).sort((a, b) => a.sort_order - b.sort_order),
  }))

  const bride = all.filter(c => c.side === 'bride')
  const groom = all.filter(c => c.side === 'groom')

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-stone-800 mb-1">Relationship Categories</h1>
        <p className="text-stone-400 text-sm">Guests pick a category when RSVPing. Add optional sub-categories to drill down further.</p>
      </div>
      <CategoriesClient bride={bride} groom={groom} />
    </div>
  )
}
