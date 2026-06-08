import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Guest, RelationshipCategory } from '@/lib/supabase/database.types'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!wedding) redirect('/setup')

  const { data: guests } = await supabase
    .from('guests')
    .select('*, relationship_categories(label)')
    .eq('wedding_id', wedding.id)
    .eq('is_removed', false)
    .order('created_at') as { data: (Guest & { relationship_categories: Pick<RelationshipCategory, 'label'> | null })[] | null }

  const rows = [
    ['Full Name', 'Phone', 'Email', 'Side', 'Category', 'RSVP Date'].join(','),
    ...(guests ?? []).map(g => [
      `"${g.full_name}"`,
      g.phone,
      g.email ?? '',
      g.side,
      g.relationship_categories?.label ?? '',
      new Date(g.rsvp_date).toLocaleDateString(),
    ].join(',')),
  ].join('\n')

  return new Response(rows, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="guest-list.csv"',
    },
  })
}
