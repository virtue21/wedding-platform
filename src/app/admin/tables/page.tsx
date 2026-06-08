import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TablesClient from './TablesClient'
import type { SeatTable, Guest, RelationshipCategory, RelationshipSubcategory } from '@/lib/supabase/database.types'

type TableWithGuests = SeatTable & { guests: Pick<Guest, 'id' | 'full_name' | 'side'>[] }
type CategoryWithSubs = RelationshipCategory & { subcategories: RelationshipSubcategory[] }

export default async function TablesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wedding } = await supabase.from('weddings').select('id').eq('user_id', user.id).single()

  const [tablesResult, guestsResult, categoriesResult] = await Promise.all([
    supabase
      .from('seat_tables')
      .select('*, guests(id, full_name, side)')
      .eq('wedding_id', wedding?.id ?? '')
      .order('sort_order'),
    supabase
      .from('guests')
      .select('id, full_name, side, table_id')
      .eq('wedding_id', wedding?.id ?? '')
      .eq('is_removed', false),
    supabase
      .from('relationship_categories')
      .select('*, relationship_subcategories(id, category_id, label, sort_order)')
      .eq('wedding_id', wedding?.id ?? '')
      .order('sort_order'),
  ])

  const tables = tablesResult.data as TableWithGuests[] | null
  const guests = guestsResult.data as Pick<Guest, 'id' | 'full_name' | 'side' | 'table_id'>[] | null
  const categories = (categoriesResult.data as CategoryWithSubs[] | null) ?? []

  const totalSeated = (guests ?? []).filter(g => g.table_id).length

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-stone-800 mb-1">Seating Plan</h1>
          <p className="text-stone-400 text-sm">
            {totalSeated} of {(guests ?? []).length} guests seated
          </p>
        </div>
      </div>
      <TablesClient tables={tables ?? []} guests={guests ?? []} categories={categories} />
    </div>
  )
}
