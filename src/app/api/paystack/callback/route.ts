import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!reference) return NextResponse.redirect(`${baseUrl}/admin/plans?error=missing_reference`)

  // Verify with Paystack
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })
  const data = await res.json()

  if (!data.status || data.data.status !== 'success') {
    return NextResponse.redirect(`${baseUrl}/admin/plans?error=payment_failed`)
  }

  const { wedding_id, plan_id } = data.data.metadata
  const supabase = createClient()

  await supabase.from('wedding_subscriptions').upsert({
    wedding_id,
    plan_id,
    paystack_reference: reference,
    status: 'active',
    amount_paid: data.data.amount ?? null, // in kobo
    activated_at: new Date().toISOString(),
  }, { onConflict: 'wedding_id' })

  // Enable RSVP automatically on subscription activation
  await supabase.from('weddings').update({ rsvp_enabled: true }).eq('id', wedding_id)

  return NextResponse.redirect(`${baseUrl}/admin/plans?success=true`)
}
