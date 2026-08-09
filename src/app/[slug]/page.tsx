import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getWeddingEntitlements } from '@/lib/subscription'
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

  const [profileResult, notesResult, photosResult, slidesResult, entitlements] = await Promise.all([
    supabase.from('user_profiles').select('bride_name, groom_name').eq('id', wedding.user_id).single(),
    supabase.from('wedding_notes').select('*').eq('wedding_id', wedding.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('wedding_photos').select('*').eq('wedding_id', wedding.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('wedding_story_slides').select('*').eq('wedding_id', wedding.id).order('slide_number'),
    // Read through the service role — subscriptions are owner-only under RLS
    getWeddingEntitlements(wedding.id),
  ])

  const { subActive, hasMoments, momentsCap } = entitlements
  // RSVP needs an active subscription; the page itself stays viewable as a preview
  const effectiveWedding: WeddingRow = {
    ...wedding,
    rsvp_enabled: (wedding.rsvp_enabled ?? false) && subActive,
  }
  const momentsCount: number = photosResult.count ?? (photosResult.data ?? []).length

  const brideName = profileResult.data?.bride_name ?? 'Bride'
  const groomName = profileResult.data?.groom_name ?? 'Groom'
  const hasMap = wedding.venue_lat != null && wedding.venue_lng != null
  const mapQuery = wedding.venue_address ?? wedding.venue_name
  const directionsUrl = hasMap
    ? `https://maps.google.com/?q=${wedding.venue_lat},${wedding.venue_lng}`
    : mapQuery
    ? `https://maps.google.com/?q=${encodeURIComponent(mapQuery)}`
    : null

  return (
    <WeddingPageClient
      wedding={effectiveWedding}
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
