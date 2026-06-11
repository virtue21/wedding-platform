import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RsvpSettingsClient from './RsvpSettingsClient'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, rsvp_enabled, rsvp_limit')
    .eq('user_id', user.id)
    .single()
  if (!wedding) redirect('/setup')

  const { count } = await supabase
    .from('guests')
    .select('id', { count: 'exact' })
    .eq('wedding_id', wedding.id)
    .eq('is_removed', false)

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-stone-800 mb-1">Settings</h1>
        <p className="text-stone-400 text-sm">Control your wedding page features</p>
      </div>
      <RsvpSettingsClient
        weddingId={wedding.id}
        initialEnabled={wedding.rsvp_enabled ?? true}
        initialLimit={wedding.rsvp_limit ?? null}
        currentCount={count ?? 0}
      />
    </div>
  )
}
