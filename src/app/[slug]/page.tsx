import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WeddingPageClient from './WeddingPageClient'
import type { WeddingRow, WeddingNote, WeddingPhoto, WeddingStorySlide } from '@/lib/supabase/database.types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default async function WeddingPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()
  const { data: wedding } = await supabase
    .from('weddings').select('*').eq('slug', params.slug).single() as { data: WeddingRow | null }
  if (!wedding) notFound()

  const [profileResult, notesResult, photosResult, slidesResult, activeSubResult, activePlansResult] = await Promise.all([
    supabase.from('user_profiles').select('bride_name, groom_name').eq('id', wedding.user_id).single(),
    supabase.from('wedding_notes').select('*').eq('wedding_id', wedding.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('wedding_photos').select('*').eq('wedding_id', wedding.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('wedding_story_slides').select('*').eq('wedding_id', wedding.id).order('slide_number'),
    supabase.from('wedding_subscriptions').select('plan_id, plans(has_moments, moments_upload_cap)').eq('wedding_id', wedding.id).eq('status', 'active').or('expires_at.is.null,expires_at.gt.' + new Date().toISOString()).limit(1).single(),
    supabase.from('plans').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  // If no plans are active in the system, unlock all features (dev/no-plan mode)
  const noActivePlans = (activePlansResult.count ?? 0) === 0
  const planData = (activeSubResult.data as { plans?: { has_moments?: boolean; moments_upload_cap?: number | null } } | null)?.plans
  const hasMoments = noActivePlans || planData?.has_moments === true
  const momentsCap: number | null = !hasMoments
    ? 0
    : (planData?.moments_upload_cap ?? null)
  const momentsCount: number = photosResult.count ?? (photosResult.data ?? []).length

  const brideName = profileResult.data?.bride_name ?? 'Bride'
  const groomName = profileResult.data?.groom_name ?? 'Groom'
  const hasMap = wedding.venue_lat != null && wedding.venue_lng != null
  const directionsUrl = hasMap
    ? `https://maps.google.com/?q=${wedding.venue_lat},${wedding.venue_lng}`
    : wedding.venue_address
    ? `https://maps.google.com/?q=${encodeURIComponent(wedding.venue_address)}`
    : `https://maps.google.com/?q=${encodeURIComponent(wedding.venue_name)}`

  return (
    <WeddingPageClient
      wedding={wedding}
      brideName={brideName}
      groomName={groomName}
      hasMap={hasMap}
      directionsUrl={directionsUrl}
      formattedDate={formatDate(wedding.wedding_date)}
      initialNotes={(notesResult.data ?? []) as WeddingNote[]}
      initialPhotos={(photosResult.data ?? []) as WeddingPhoto[]}
      storySlides={(slidesResult.data ?? []) as WeddingStorySlide[]}
      slug={params.slug}
      hasMoments={hasMoments}
      momentsCap={momentsCap}
      momentsCount={momentsCount}
    />
  )
}
