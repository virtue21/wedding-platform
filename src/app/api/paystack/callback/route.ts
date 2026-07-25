import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { sendPaymentConfirmationEmail } from '@/lib/email/sendPaymentConfirmation'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference')
  const baseUrl = process.env.PAYSTACK_CALLBACK_BASE_URL
    ?? process.env.NEXT_PUBLIC_APP_URL
    ?? 'https://nemiplanner.xyz'

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
  const amountKobo: number = data.data.amount ?? 0
  const supabase = createClient()

  await supabase.from('wedding_subscriptions').upsert({
    wedding_id,
    plan_id,
    paystack_reference: reference,
    status: 'active',
    amount_paid: amountKobo,
    activated_at: new Date().toISOString(),
  }, { onConflict: 'wedding_id' })

  // Enable RSVP automatically on subscription activation
  await supabase.from('weddings').update({ rsvp_enabled: true }).eq('id', wedding_id)

  await logAudit({
    actorType: 'couple',
    action: 'payment.activated',
    weddingId: wedding_id,
    detail: { plan_id, reference, amount_kobo: amountKobo },
  })

  // Send payment confirmation email (fire-and-forget, don't block redirect)
  try {
    const sb = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const [{ data: wedding }, { data: plan }] = await Promise.all([
      sb.from('weddings').select('user_id').eq('id', wedding_id).single(),
      sb.from('plans').select('name').eq('id', plan_id).single(),
    ])

    if (wedding) {
      const [{ data: profile }, authResult] = await Promise.all([
        sb.from('user_profiles').select('bride_name, groom_name').eq('id', wedding.user_id).single(),
        sb.auth.admin.getUserById(wedding.user_id),
      ])
      const email = authResult.data?.user?.email
      if (email && profile) {
        await sendPaymentConfirmationEmail(email, {
          brideName: profile.bride_name ?? 'there',
          groomName: profile.groom_name ?? '',
          planName: plan?.name ?? 'Plan',
          amountKobo,
          reference,
          appUrl: baseUrl,
        })
      }
    }
  } catch (err) {
    console.error('[Payment email] Failed to send confirmation:', err)
  }

  return NextResponse.redirect(`${baseUrl}/admin/plans?success=true`)
}
