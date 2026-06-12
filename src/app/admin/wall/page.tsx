import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import WallClient from './WallClient'
import SectionGuide from '@/components/SectionGuide'
import type { WeddingNote, WeddingPhoto } from '@/lib/supabase/database.types'

export default async function WallPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: wedding } = await supabase.from('weddings').select('id').eq('user_id', user.id).single()
  if (!wedding) redirect('/setup')

  const [notesResult, photosResult, subResult] = await Promise.all([
    supabase.from('wedding_notes').select('*').eq('wedding_id', wedding.id).order('created_at', { ascending: false }),
    supabase.from('wedding_photos').select('*').eq('wedding_id', wedding.id).order('created_at', { ascending: false }),
    supabase.from('wedding_subscriptions')
      .select('status, plans(has_moments)')
      .eq('wedding_id', wedding.id)
      .in('status', ['active', 'paused'])
      .single(),
  ])

  const planData = (subResult.data as { status: string; plans?: { has_moments?: boolean } } | null)
  // Moments feature is active only when subscription is active (not paused) AND plan includes it
  const hasMoments = planData?.status === 'active' && planData?.plans?.has_moments === true

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-stone-800 mb-1">Guest Wall</h1>
        <p className="text-stone-400 text-sm">Wishes and moments shared by your guests</p>
      </div>

      <SectionGuide
        icon="💌"
        title="Wishes & Moments"
        body="This is everything your guests have shared on your wedding page — written wishes from the Wishes tab and photos they've uploaded in Moments. You can delete anything that shouldn't be there."
        tip="Guests post directly from your invite page — no login needed. Share the link to encourage them to leave a message before the big day."
      />

      {/* Moments locked banner — shown when plan doesn't include it */}
      {!hasMoments && (
        <div className="flex items-center justify-between gap-4 p-4 bg-stone-50 border border-stone-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔒</span>
            <div>
              <p className="text-sm font-medium text-stone-700">Moments is not on your current plan</p>
              <p className="text-xs text-stone-400 mt-0.5">
                {(photosResult.data ?? []).length > 0
                  ? 'Existing photos are shown below but guests can\'t upload new ones.'
                  : 'Upgrade to allow guests to share photos on your wedding page.'}
              </p>
            </div>
          </div>
          <Link
            href="/admin/plans"
            className="flex-shrink-0 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium rounded-xl transition-colors"
          >
            Upgrade
          </Link>
        </div>
      )}

      <WallClient
        notes={(notesResult.data ?? []) as WeddingNote[]}
        photos={(photosResult.data ?? []) as WeddingPhoto[]}
        momentslocked={!hasMoments}
      />
    </div>
  )
}
