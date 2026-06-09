import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import type { WeddingRow } from '@/lib/supabase/database.types'

const VenueMap = dynamic(() => import('@/components/VenueMap'), { ssr: false })

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

  const { data: profile } = await supabase
    .from('user_profiles').select('bride_name, groom_name').eq('id', wedding.user_id).single()

  const brideName = profile?.bride_name ?? 'Bride'
  const groomName = profile?.groom_name ?? 'Groom'

  const hasMap = wedding.venue_lat != null && wedding.venue_lng != null
  const directionsUrl = hasMap
    ? `https://maps.google.com/?q=${wedding.venue_lat},${wedding.venue_lng}`
    : wedding.venue_address
    ? `https://maps.google.com/?q=${encodeURIComponent(wedding.venue_address)}`
    : null

  return (
    <div className="min-h-screen bg-[#fdf8f4]">
      <div className="max-w-lg mx-auto">
        {wedding.cover_image_url ? (
          <div className="relative w-full aspect-[4/3]">
            <Image src={wedding.cover_image_url} alt={`${brideName} & ${groomName}`} fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="text-white/70 text-sm mb-1 tracking-widest uppercase">You&apos;re invited</p>
              <h1 className="font-serif text-4xl text-white leading-tight">{brideName} <span className="text-rose-300">&</span> {groomName}</h1>
            </div>
          </div>
        ) : (
          <div className="bg-rose-50 px-8 pt-20 pb-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-8 text-6xl rotate-12">🌸</div>
              <div className="absolute top-8 right-6 text-5xl -rotate-12">🌹</div>
              <div className="absolute bottom-6 left-4 text-4xl rotate-6">💐</div>
              <div className="absolute bottom-4 right-8 text-5xl -rotate-6">🌺</div>
            </div>
            <p className="text-rose-400 text-sm mb-3 tracking-widest uppercase relative">You&apos;re invited</p>
            <h1 className="font-serif text-4xl text-stone-800 leading-tight relative">
              {brideName} <span className="text-rose-400">&</span> {groomName}
            </h1>
          </div>
        )}

        <div className="px-6 py-8 space-y-5">
          {/* Date + Venue card */}
          <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">📅</span>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wide">Date</p>
                <p className="font-medium text-stone-800 mt-0.5">{formatDate(wedding.wedding_date)}</p>
              </div>
            </div>
            <div className="h-px bg-rose-50" />
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">📍</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-stone-400 uppercase tracking-wide">Venue</p>
                <p className="font-medium text-stone-800 mt-0.5">{wedding.venue_name}</p>
                {wedding.venue_address && <p className="text-sm text-stone-400 mt-0.5">{wedding.venue_address}</p>}
              </div>
            </div>

            {/* Map */}
            {hasMap && (
              <div className="space-y-3">
                <VenueMap
                  lat={wedding.venue_lat!}
                  lng={wedding.venue_lng!}
                  venueName={wedding.venue_name}
                />
                {directionsUrl && (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 border border-rose-200 hover:border-rose-300 text-rose-500 text-sm font-medium rounded-xl transition-colors bg-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                    View on Map
                  </a>
                )}
              </div>
            )}

            {/* Directions link even without map coords */}
            {!hasMap && directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-rose-200 text-rose-500 text-sm font-medium rounded-xl bg-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>
                Get Directions
              </a>
            )}
          </div>

          <Link
            href={`/${params.slug}/rsvp`}
            className="block w-full text-center py-4 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-2xl transition-colors text-base shadow-sm shadow-rose-200"
          >
            Confirm Your Attendance
          </Link>

          <Link
            href={`/${params.slug}/registry`}
            className="block w-full text-center py-3.5 border border-rose-200 hover:border-rose-300 text-rose-500 font-medium rounded-2xl transition-colors text-sm bg-white"
          >
            🎁 View Gift Registry
          </Link>
        </div>
      </div>
    </div>
  )
}
