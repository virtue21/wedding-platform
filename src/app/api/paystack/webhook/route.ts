import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

function serviceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!).update(body).digest('hex')
  const signature = req.headers.get('x-paystack-signature')
  if (hash !== signature) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })

  const event = JSON.parse(body)
  if (event.event === 'charge.success') {
    const { reference, metadata } = event.data
    if (!metadata?.wedding_id || !metadata?.plan_id) return NextResponse.json({ ok: true })
    // Service role — this is Paystack calling us server-to-server with no
    // user session at all, so the request-scoped client used here
    // previously had no auth.uid() to satisfy the owner-write RLS policy.
    // Its upsert failed on every single invocation, silently, since the
    // result was never checked.
    const sb = serviceClient()
    const { error } = await sb.from('wedding_subscriptions').upsert({
      wedding_id: metadata.wedding_id,
      plan_id: metadata.plan_id,
      paystack_reference: reference,
      status: 'active',
      activated_at: new Date().toISOString(),
    }, { onConflict: 'wedding_id' })
    if (error) {
      console.error('[Paystack webhook] Failed to activate subscription:', error, { wedding_id: metadata.wedding_id, plan_id: metadata.plan_id, reference })
    }
    await sb.from('weddings').update({ rsvp_enabled: true }).eq('id', metadata.wedding_id)
  }
  return NextResponse.json({ ok: true })
}
