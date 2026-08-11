import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { sendRefundEmail } from '@/lib/email/sendRefund'

function serviceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function handleChargeSuccess(sb: ReturnType<typeof serviceClient>, event: { data: Record<string, unknown> }) {
  const { reference, metadata } = event.data as { reference: string; metadata?: { wedding_id?: string; plan_id?: string } }
  if (!metadata?.wedding_id || !metadata?.plan_id) return
  // Service role — this is Paystack calling us server-to-server with no
  // user session at all, so the request-scoped client used here
  // previously had no auth.uid() to satisfy the owner-write RLS policy.
  // Its upsert failed on every single invocation, silently, since the
  // result was never checked.
  const { error } = await sb.from('wedding_subscriptions').upsert({
    wedding_id: metadata.wedding_id,
    plan_id: metadata.plan_id,
    paystack_reference: reference,
    status: 'active',
    activated_at: new Date().toISOString(),
  }, { onConflict: 'wedding_id' })
  if (error) {
    console.error('[Paystack webhook] Failed to activate subscription:', error, { wedding_id: metadata.wedding_id, plan_id: metadata.plan_id, reference })
    return
  }
  await sb.from('weddings').update({ rsvp_enabled: true }).eq('id', metadata.wedding_id)
}

// A refund carries no wedding_id metadata of its own — it's tied back to
// the original charge only by that charge's reference, under one of a few
// possible field names depending on Paystack API version.
function originalReferenceOf(data: Record<string, unknown>): string | null {
  if (typeof data.transaction_reference === 'string') return data.transaction_reference
  const tx = data.transaction as { reference?: string } | undefined
  if (tx?.reference) return tx.reference
  return null
}

async function handleRefundProcessed(sb: ReturnType<typeof serviceClient>, event: { data: Record<string, unknown> }) {
  const reference = originalReferenceOf(event.data)
  const refundedKobo = typeof event.data.amount === 'number' ? event.data.amount : 0
  if (!reference) {
    console.error('[Paystack webhook] refund.processed had no resolvable original transaction reference', event.data)
    return
  }

  const { data: sub } = await sb
    .from('wedding_subscriptions')
    .select('wedding_id, plan_id, amount_paid, status')
    .eq('paystack_reference', reference)
    .maybeSingle()

  if (!sub) {
    console.error('[Paystack webhook] refund.processed: no subscription found for reference', reference)
    return
  }

  // Only auto-deactivate on a full refund. A partial refund doesn't mean
  // the couple should lose the plan they mostly still paid for — flag it
  // for manual review instead of guessing.
  if (sub.amount_paid !== null && refundedKobo < sub.amount_paid) {
    console.warn('[Paystack webhook] Partial refund — not auto-deactivating, needs manual review', { reference, refundedKobo, amountPaid: sub.amount_paid, wedding_id: sub.wedding_id })
    return
  }

  const { error } = await sb.from('wedding_subscriptions')
    .update({ status: 'cancelled' })
    .eq('wedding_id', sub.wedding_id)
  if (error) {
    console.error('[Paystack webhook] Failed to cancel subscription after refund:', error, { wedding_id: sub.wedding_id, reference })
    return
  }
  await sb.from('weddings').update({ rsvp_enabled: false }).eq('id', sub.wedding_id)

  try {
    const [{ data: wedding }, { data: plan }] = await Promise.all([
      sb.from('weddings').select('user_id').eq('id', sub.wedding_id).single(),
      sb.from('plans').select('name').eq('id', sub.plan_id).single(),
    ])
    if (wedding) {
      const [{ data: profile }, authResult] = await Promise.all([
        sb.from('user_profiles').select('bride_name, groom_name').eq('id', wedding.user_id).single(),
        sb.auth.admin.getUserById(wedding.user_id),
      ])
      const email = authResult.data?.user?.email
      if (email && profile) {
        await sendRefundEmail(email, {
          brideName: profile.bride_name ?? 'there',
          groomName: profile.groom_name ?? '',
          planName: plan?.name ?? 'Plan',
          amountKobo: refundedKobo,
          reference,
          appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://nemiplanner.xyz',
        })
      }
    }
  } catch (err) {
    console.error('[Refund email] Failed to send:', err)
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!).update(body).digest('hex')
  const signature = req.headers.get('x-paystack-signature')
  if (hash !== signature) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })

  const event = JSON.parse(body)
  const sb = serviceClient()

  if (event.event === 'charge.success') {
    await handleChargeSuccess(sb, event)
  } else if (event.event === 'refund.processed') {
    await handleRefundProcessed(sb, event)
  }

  return NextResponse.json({ ok: true })
}
