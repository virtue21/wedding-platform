import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import AdminIdentify from './AdminIdentify'
import AdminSidebar from './AdminSidebar'

type Profile = Database['public']['Tables']['user_profiles']['Row']

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('bride_name, groom_name')
    .eq('id', user.id)
    .single() as { data: Pick<Profile, 'bride_name' | 'groom_name'> | null }

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, slug, wedding_date')
    .eq('user_id', user.id)
    .single()

  const coupleNames = profile?.bride_name && profile?.groom_name
    ? `${profile.bride_name} & ${profile.groom_name}`
    : null

  const counts = { guests: 0, registry: 0, wall: 0 }
  if (wedding) {
    const [{ count: guestCount }, { count: registryCount }, { count: wallCount }] = await Promise.all([
      supabase.from('guests').select('id', { count: 'exact', head: true }).eq('wedding_id', wedding.id).eq('is_removed', false),
      supabase.from('registry_items').select('id', { count: 'exact', head: true }).eq('wedding_id', wedding.id),
      supabase.from('wedding_notes').select('id', { count: 'exact', head: true }).eq('wedding_id', wedding.id),
    ])
    counts.guests = guestCount ?? 0
    counts.registry = registryCount ?? 0
    counts.wall = wallCount ?? 0
  }

  return (
    <div className="min-h-screen bg-[#fdf8f4] flex">
      <AdminIdentify userId={user.id} />
      <AdminSidebar
        coupleNames={coupleNames}
        weddingDate={wedding?.wedding_date ?? null}
        guestSlug={wedding?.slug ?? null}
        counts={counts}
      />
      <main className="flex-1 min-w-0 px-8 py-8">{children}</main>
    </div>
  )
}
