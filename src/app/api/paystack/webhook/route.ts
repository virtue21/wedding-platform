import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!).update(body).digest('hex')
  const signature = req.headers.get('x-paystack-signature')
  if (hash !== signature) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })

  const event = JSON.parse(body)
  if (event.event === 'charge.success') {
    const { reference, metadata } = event.data
    if (!metadata?.wedding_id || !metadata?.plan_id) return NextResponse.json({ ok: true })
    const supabase = createClient()
    await supabase.from('wedding_subscriptions').upsert({
      wedding_id: metadata.wedding_id,
      plan_id: metadata.plan_id,
      paystack_reference: reference,
      status: 'active',
      activated_at: new Date().toISOString(),
    }, { onConflict: 'wedding_id' })
    await supabase.from('weddings').update({ rsvp_enabled: true }).eq('id', metadata.wedding_id)
  }
  return NextResponse.json({ ok: true })
}
