import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WallClient from './WallClient'
import type { WeddingNote, WeddingPhoto } from '@/lib/supabase/database.types'

export default async function WallPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: wedding } = await supabase.from('weddings').select('id').eq('user_id', user.id).single()
  if (!wedding) redirect('/setup')

  const [notesResult, photosResult] = await Promise.all([
    supabase.from('wedding_notes').select('*').eq('wedding_id', wedding.id).order('created_at', { ascending: false }),
    supabase.from('wedding_photos').select('*').eq('wedding_id', wedding.id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-stone-800 mb-1">Guest Wall</h1>
        <p className="text-stone-400 text-sm">Wishes and moments shared by your guests</p>
      </div>
      <WallClient
        notes={(notesResult.data ?? []) as WeddingNote[]}
        photos={(photosResult.data ?? []) as WeddingPhoto[]}
      />
    </div>
  )
}
