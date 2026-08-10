import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { sendPaymentConfirmationEmail } from '@/lib/email/sendPaymentConfirmation'
import { logAudit } from '@/lib/audit'

function serviceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference')
  // This route is hit at whatever origin initialize sent Paystack as the
  // callback_url, so it's already the right environment (prod vs uat) —
  // no need to guess from a static env var here. Only Paystack calling
  // back to a dev tunnel/localhost would need the fallback, and Paystack
  // can't reach localhost anyway.
  const requestOrigin = req.nextUrl.origin
  const isLocal = requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1')
  const baseUrl = isLocal
    ? (process.env.PAYSTACK_CALLBACK_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://nemiplanner.xyz')
    : requestOrigin

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
  // Service role, not the request-scoped client: this is a system-to-system
  // reconciliation against Paystack's own verified response, not a
  // user-initiated write. The couple's browser session may well have
  // expired while they were away on Paystack's checkout page for a couple
  // of minutes — an RLS-gated write would then silently fail (its result
  // was never even checked), while everything after it, including the
  // "payment confirmed" email, kept firing regardless.
  const sb = serviceClient()

  const { error: subError } = await sb.from('wedding_subscriptions').upsert({
    wedding_id,
    plan_id,
    paystack_reference: reference,
    status: 'active',
    amount_paid: amountKobo,
    activated_at: new Date().toISOString(),
  }, { onConflict: 'wedding_id' })

  if (subError) {
    console.error('[Paystack callback] Failed to activate subscription:', subError, { wedding_id, plan_id, reference })
    return NextResponse.redirect(`${baseUrl}/admin/plans?error=activation_failed`)
  }

  // Enable RSVP automatically on subscription activation
  await sb.from('weddings').update({ rsvp_enabled: true }).eq('id', wedding_id)

  await logAudit({
    actorType: 'couple',
    action: 'payment.activated',
    weddingId: wedding_id,
    detail: { plan_id, reference, amount_kobo: amountKobo },
  })

  // Send payment confirmation email (fire-and-forget, don't block redirect)
  try {
    const [{ data: wedding }, { data: plan }] = await Promise.all([
      sb.from('weddings').select('user_id').eq('id', wedding_id).single(),
      sb.from('plans')
        .select('name, guest_cap, registry_item_cap, table_cap, has_moments, moments_upload_cap, has_cover_image, has_digital_iv, has_story_images')
        .eq('id', plan_id)
        .single(),
    ])

    const features: string[] = plan ? [
      plan.guest_cap ? `${plan.guest_cap} guests` : 'Unlimited guests',
      plan.registry_item_cap ? `${plan.registry_item_cap} registry items` : 'Unlimited registry items',
      plan.table_cap ? `${plan.table_cap} tables` : 'Unlimited tables',
      ...(plan.has_moments
        ? [
            plan.moments_upload_cap ? `${plan.moments_upload_cap} guest photo uploads` : 'Unlimited guest photo uploads',
            'Share photos to WhatsApp, Instagram & TikTok',
            'Google Drive photo backup',
          ]
        : []),
      ...(plan.has_story_images ? ['AI story illustrations'] : []),
      ...(plan.has_cover_image ? ['Cover image'] : []),
      ...(plan.has_digital_iv ? ['Digital invite + QR code'] : []),
    ] : []

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
          features,
        })
      }
    }
  } catch (err) {
    console.error('[Payment email] Failed to send confirmation:', err)
  }

  return NextResponse.redirect(`${baseUrl}/admin/plans?success=true`)
}
