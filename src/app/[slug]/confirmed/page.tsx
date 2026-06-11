import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { WeddingRow } from '@/lib/supabase/database.types'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function ConfirmedPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { guest_id?: string }
}) {
  const supabase = createClient()

  const { data: wedding } = await supabase
    .from('weddings').select('*').eq('slug', params.slug).single() as { data: WeddingRow | null }

  if (!wedding) notFound()

  const guestId = searchParams.guest_id ?? ''
  const registryUrl = `/${params.slug}/registry${guestId ? `?guest_id=${guestId}` : ''}`

  // Fetch guest + their table
  let guestName = ''
  let tableName: string | null = null
  let tablemates: { id: string; full_name: string }[] = []

  if (guestId) {
    const { data: guest } = await supabase
      .from('guests')
      .select('id, full_name, table_id')
      .eq('id', guestId)
      .single()

    if (guest) {
      guestName = guest.full_name
      if (guest.table_id) {
        const { data: table } = await supabase
          .from('seat_tables')
          .select('id, label')
          .eq('id', guest.table_id)
          .single()

        if (table) {
          tableName = table.label
          const { data: others } = await supabase
            .from('guests')
            .select('id, full_name')
            .eq('table_id', table.id)
            .eq('is_removed', false)
            .neq('id', guestId)
            .limit(20)

          tablemates = others ?? []
        }
      }
    }
  }

  const firstName = guestName.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-[#fdf8f4]">
      <div className="max-w-sm mx-auto px-5 py-12 space-y-5">

        {/* Hero */}
        <div className="text-center">
          <div className="text-6xl mb-5">🎉</div>
          <h1 className="font-serif text-3xl text-stone-800 mb-2">You&apos;re on the list! 🎉</h1>
          <p className="text-stone-500 text-sm font-medium">Hey {firstName} — we&apos;re so glad you&apos;re coming.</p>
          <p className="text-stone-400 text-sm leading-relaxed">
            See you on {formatDate(wedding.wedding_date)}<br />at {wedding.venue_name}
          </p>

          {/* View on Map — always show, fall back through coords → address → venue name */}
          <a
            href={
              (wedding.venue_lat && wedding.venue_lng)
                ? `https://www.google.com/maps?q=${wedding.venue_lat},${wedding.venue_lng}`
                : wedding.venue_address
                ? `https://www.google.com/maps/search/${encodeURIComponent(wedding.venue_address)}`
                : `https://www.google.com/maps/search/${encodeURIComponent(wedding.venue_name)}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-xs text-rose-500 hover:text-rose-600 font-medium transition-colors"
          >
            📍 View on Map
          </a>

          <p className="text-xs text-stone-400 mt-3 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
            ✉️ A copy of your invitation has been sent to your email.
          </p>
        </div>

        {/* Table assignment */}
        {tableName ? (
          <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🪑</span>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wide font-medium">Your table</p>
                <p className="font-serif text-lg text-stone-800">{tableName}</p>
              </div>
            </div>

            {tablemates.length > 0 ? (
              <>
                <p className="text-xs text-stone-400 mb-3">Also at your table:</p>
                <div className="flex flex-wrap gap-2">
                  {tablemates.map(g => (
                    <span
                      key={g.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-xs text-rose-700 font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-300 inline-block" />
                      {g.full_name.split(' ')[0]}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-stone-400 italic">You&apos;re the first one assigned to this table.</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5 flex items-center gap-3">
            <span className="text-xl">🪑</span>
            <p className="text-sm text-stone-400">Table assignment will be shared closer to the date.</p>
          </div>
        )}

        {/* Registry CTA */}
        <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5 text-center">
          <p className="font-serif text-base text-stone-700 mb-1">Want to give a gift?</p>
          <p className="text-xs text-stone-400 mb-4">Browse our registry and help us start our new chapter.</p>
          <Link
            href={registryUrl}
            className="block w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl transition-colors text-sm shadow-sm shadow-rose-200"
          >
            🎁 View Gift Registry →
          </Link>
        </div>

      </div>
    </div>
  )
}
