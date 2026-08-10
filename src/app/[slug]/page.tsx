import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
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

  const [profileResult, notesResult, photosResult, slidesResult, registryResult, entitlements] = await Promise.all([
    supabase.from('user_profiles').select('bride_name, groom_name').eq('id', wedding.user_id).single(),
    supabase.from('wedding_notes').select('*').eq('wedding_id', wedding.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('wedding_photos').select('*').eq('wedding_id', wedding.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('wedding_story_slides').select('*').eq('wedding_id', wedding.id).order('slide_number'),
    supabase.from('registry_items')
      .select('quantity_needed, quantity_claimed')
      .eq('wedding_id', wedding.id),
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
  const wishesPublic = wedding.wishes_public ?? true

  // Gifts still available, shown as "N left" on the home screen
  const registryRemaining = (registryResult.data ?? []).reduce(
    (n, i) => n + Math.max(0, (i.quantity_needed ?? 0) - (i.quantity_claimed ?? 0)), 0
  )
  // Set when this guest RSVP'd, so we greet them instead of re-asking
  const confirmed = !!cookies().get(`nemi_guest_${wedding.id}`)?.value

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
      directionsUrl={directionsUrl}
      formattedDate={formatDate(wedding.wedding_date)}
      initialNotes={wishesPublic ? ((notesResult.data ?? []) as WeddingNote[]) : []}
      wishesPublic={wishesPublic}
      initialPhotos={(photosResult.data ?? []) as WeddingPhoto[]}
      storySlides={(slidesResult.data ?? []) as WeddingStorySlide[]}
      slug={params.slug}
      hasMoments={hasMoments}
      momentsCap={momentsCap}
      momentsCount={momentsCount}
      registryRemaining={registryRemaining}
      confirmed={confirmed}
    />
  )
}
