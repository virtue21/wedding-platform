'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { WeddingRow, GuestRow } from '@/lib/supabase/database.types'
import { sendInvitationEmail } from '@/lib/email/sendInvitation'

export async function submitRsvp(slug: string, formData: FormData) {
  const supabase = createClient()

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, user_id, venue_name, venue_address, venue_lat, venue_lng, wedding_date, cover_image_url')
    .eq('slug', slug)
    .single() as { data: Pick<WeddingRow, 'id' | 'user_id' | 'venue_name' | 'venue_address' | 'venue_lat' | 'venue_lng' | 'wedding_date' | 'cover_image_url'> | null }

  if (!wedding) redirect(`/${slug}`)

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('bride_name, groom_name')
    .eq('id', wedding.user_id)
    .single()

  const brideName = profile?.bride_name ?? 'Bride'
  const groomName = profile?.groom_name ?? 'Groom'

  const phone = (formData.get('phone') as string).trim()
  const email = ((formData.get('email') as string) || '').trim().toLowerCase() || null

  // ── Duplicate phone check ──────────────────────────────────────
  const { data: dupPhone } = await supabase
    .from('guests')
    .select('id')
    .eq('wedding_id', wedding.id)
    .eq('phone', phone)
    .eq('is_removed', false)
    .single() as { data: Pick<GuestRow, 'id'> | null }

  if (dupPhone) {
    redirect(`/${slug}/rsvp?error=${encodeURIComponent('This phone number has already been used to RSVP. If you think this is a mistake, contact the couple.')}`)
  }

  // ── Duplicate email check (only if email provided) ─────────────
  if (email) {
    const { data: dupEmail } = await supabase
      .from('guests')
      .select('id')
      .eq('wedding_id', wedding.id)
      .eq('email', email)
      .eq('is_removed', false)
      .single() as { data: Pick<GuestRow, 'id'> | null }

    if (dupEmail) {
      redirect(`/${slug}/rsvp?error=${encodeURIComponent('This email address has already been used to RSVP. If you think this is a mistake, contact the couple.')}`)
    }
  }

  const full_name = (formData.get('full_name') as string).trim()
  const side = formData.get('side') as 'bride' | 'groom' | 'both'
  const category_id = formData.get('category_id') as string

  // ── Auto-assign table based on category ───────────────────────
  // Find a table linked to this category that still has capacity
  const { data: matchingTable } = await supabase
    .from('seat_tables')
    .select('id, capacity')
    .eq('wedding_id', wedding.id)
    .eq('category_id', category_id)
    .single()

  let table_id: string | null = null
  if (matchingTable) {
    // Count current guests at this table
    const { count } = await supabase
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .eq('table_id', matchingTable.id)
      .eq('is_removed', false)

    if ((count ?? 0) < matchingTable.capacity) {
      table_id = matchingTable.id
    }
  }

  const { data: guest, error } = await supabase
    .from('guests')
    .insert({ wedding_id: wedding.id, full_name, phone, email, side, category_id, table_id })
    .select('id')
    .single() as { data: Pick<GuestRow, 'id'> | null; error: unknown }

  if (error || !guest) {
    redirect(`/${slug}/rsvp?error=${encodeURIComponent('Something went wrong. Please try again.')}`)
  }

  // ── Send invitation email if guest provided their email ────────
  if (email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nemiplanner.xyz'
    await sendInvitationEmail({
      guestEmail:    email,
      guestName:     full_name,
      brideName,
      groomName,
      weddingDate:   wedding.wedding_date,
      venueName:     wedding.venue_name,
      venueAddress:  wedding.venue_address,
      venueLat:      wedding.venue_lat,
      venueLng:      wedding.venue_lng,
      coverImageUrl: wedding.cover_image_url,
      weddingId:     wedding.id,
      calendarUrl:   `${appUrl}/api/calendar/${wedding.id}`,
    })
  }

  redirect(`/${slug}/confirmed?guest_id=${guest.id}`)
}
