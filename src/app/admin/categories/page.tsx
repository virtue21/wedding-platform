import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CategoriesClient from './CategoriesClient'
import SectionGuide from '@/components/SectionGuide'

export default async function CategoriesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wedding } = await supabase
    .from('weddings').select('id').eq('user_id', user.id).single()
  if (!wedding) redirect('/setup')

  return (
    <div>
      <SectionGuide
        icon="🏷️"
        title="Guest Categories"
        body="These are the relationship groups guests choose from when they RSVP — things like Family, Church friends, Work colleagues, or University friends. Set them up per side (Bride's side / Groom's side) so you can see exactly how everyone knows you."
        tip="Set these up before sharing your invite link. Guests won't be able to RSVP without at least one category on each side."
      />
      <CategoriesClient weddingId={wedding.id} />
    </div>
  )
}
