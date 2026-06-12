import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import TablesClient from './TablesClient'
import SectionGuide from '@/components/SectionGuide'
import type { SeatTable, Guest, RelationshipCategory, RelationshipSubcategory } from '@/lib/supabase/database.types'

type TableWithGuests = SeatTable & { guests: Pick<Guest, 'id' | 'full_name' | 'side'>[] }
type CategoryWithSubs = RelationshipCategory & { subcategories: RelationshipSubcategory[] }

export default async function TablesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wedding } = await supabase.from('weddings').select('id').eq('user_id', user.id).single()

  const [tablesResult, guestsResult, categoriesResult, subResult] = await Promise.all([
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
      .select('*, subcategories:relationship_subcategories(id, category_id, label, sort_order)')
      .eq('wedding_id', wedding?.id ?? '')
      .order('sort_order'),
    supabase
      .from('wedding_subscriptions')
      .select('plan_id, plans(table_cap)')
      .eq('wedding_id', wedding?.id ?? '')
      .eq('status', 'active')
      .single(),
  ])

  const tables = tablesResult.data as TableWithGuests[] | null
  const guests = guestsResult.data as Pick<Guest, 'id' | 'full_name' | 'side' | 'table_id'>[] | null
  const categories = (categoriesResult.data as CategoryWithSubs[] | null) ?? []

  const tableCap = (subResult.data as { plans?: { table_cap?: number | null } } | null)?.plans?.table_cap ?? null
  const tableCount = (tables ?? []).length
  const atTableCap = tableCap !== null && tableCount >= tableCap

  const totalSeated = (guests ?? []).filter(g => g.table_id).length

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-stone-800 mb-1">Seating Plan</h1>
          <p className="text-stone-400 text-sm">
            {totalSeated} of {(guests ?? []).length} guests assigned to a table
          </p>
        </div>
      </div>

      <SectionGuide
        icon="🪑"
        title="Table assignments — not individual seats"
        body="Here you create tables (e.g. Table 1, Head Table, Family Table) and assign confirmed guests to them. This organises who sits with who — it doesn't assign specific chairs within a table. Do this after your RSVP list is mostly finalised."
        tip="Wait until most RSVPs are in before arranging seating. Use the Guests page to see who's confirmed first."
      />
      {atTableCap && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-700 flex items-center justify-between gap-4">
          <span>⚠️ You&apos;ve reached your plan limit of {tableCap} tables. Upgrade to add more.</span>
          <Link href="/admin/plans" className="text-amber-700 font-medium underline whitespace-nowrap">Upgrade →</Link>
        </div>
      )}
      <TablesClient tables={tables ?? []} guests={guests ?? []} categories={categories} atTableCap={atTableCap} />
    </div>
  )
}
