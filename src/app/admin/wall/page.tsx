import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

// Notes are read via the service role (see below), and Next.js caches
// server-side fetches by default — without this, a delete can revalidate
// the route yet still serve the pre-delete list on refresh.
export const dynamic = 'force-dynamic'

function serviceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
import WallClient from './WallClient'
import SectionGuide from '@/components/SectionGuide'
import { MessageSquare, FolderOpen, Lock } from 'lucide-react'
import type { WeddingNote, WeddingPhoto } from '@/lib/supabase/database.types'

export default async function WallPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: wedding } = await supabase.from('weddings').select('*').eq('user_id', user.id).single()
  if (!wedding) redirect('/setup')
  const driveFolderUrl = (wedding as { drive_folder_url?: string | null }).drive_folder_url ?? null

  const [notesResult, photosResult, subResult, activePlansResult] = await Promise.all([
    // Service role: when wishes are private, RLS hides them from the anon
    // client — but the couple must still see their own guests' messages.
    serviceClient().from('wedding_notes').select('*').eq('wedding_id', wedding.id).order('created_at', { ascending: false }),
    supabase.from('wedding_photos').select('*').eq('wedding_id', wedding.id).order('created_at', { ascending: false }),
    supabase.from('wedding_subscriptions')
      .select('status, plans(has_moments)')
      .eq('wedding_id', wedding.id)
      .eq('status', 'active')
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .limit(1)
      .single(),
    supabase.from('plans').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const noActivePlans = (activePlansResult.count ?? 0) === 0
  const planData = (subResult.data as { status: string; plans?: { has_moments?: boolean } } | null)
  const hasMoments = noActivePlans || (planData?.status === 'active' && planData?.plans?.has_moments === true)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-stone-800 mb-1">Guest Wall</h1>
        <p className="text-stone-400 text-sm">Wishes and moments shared by your guests</p>
      </div>

      <SectionGuide
        id="wall"
        icon={<MessageSquare size={18} />}
        title="Wishes & Moments"
        body="This is everything your guests have shared on your wedding page — written wishes from the Wishes tab and photos they've uploaded in Moments. You can delete anything that shouldn't be there."
        tip="Guests post directly from your invite page — no login needed. Share the link to encourage them to leave a message before the big day."
      />

      {/* Google Drive photo archive — Classic/Grand/Prestige only */}
      {hasMoments && driveFolderUrl && (
        <div className="flex items-center justify-between gap-4 p-4 bg-white border border-rose-50 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <FolderOpen size={20} className="text-stone-400" />
            <div>
              <p className="text-sm font-medium text-stone-700">All guest photos, saved to Google Drive</p>
              <p className="text-xs text-stone-400 mt-0.5">
                Every photo your guests upload is automatically backed up to a Drive folder shared with your email.
              </p>
            </div>
          </div>
          <a
            href={driveFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 px-4 py-2 border border-rose-200 hover:border-rose-300 text-rose-500 text-xs font-medium rounded-xl transition-colors bg-white"
          >
            Open folder ↗
          </a>
        </div>
      )}

      {/* Moments locked banner — shown when plan doesn't include it */}
      {!hasMoments && (
        <div className="flex items-center justify-between gap-4 p-4 bg-stone-50 border border-stone-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-stone-400" />
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
