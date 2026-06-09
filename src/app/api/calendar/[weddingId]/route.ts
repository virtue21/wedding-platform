import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: { weddingId: string } }
) {
  const supabase = createClient()

  const { data: wedding } = await supabase
    .from('weddings')
    .select('user_id, wedding_date, venue_name, venue_address')
    .eq('id', params.weddingId)
    .single()

  if (!wedding) return new NextResponse('Not found', { status: 404 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('bride_name, groom_name')
    .eq('id', wedding.user_id)
    .single()

  const brideName = profile?.bride_name ?? 'Bride'
  const groomName = profile?.groom_name ?? 'Groom'

  // Build .ics — all-day event
  const dateStr = wedding.wedding_date.replace(/-/g, '')
  const summary  = `${brideName} & ${groomName}'s Wedding`
  const location = [wedding.venue_name, wedding.venue_address].filter(Boolean).join(', ')
  const now      = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NemiPlanner//Wedding//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${params.weddingId}@nemiplanner.xyz`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${dateStr}`,
    `DTEND;VALUE=DATE:${dateStr}`,
    `SUMMARY:${summary}`,
    location ? `LOCATION:${location}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="wedding.ics"`,
    },
  })
}
