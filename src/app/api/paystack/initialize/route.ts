import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { planId } = await req.json()
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: wedding } = await supabase.from('weddings').select('id, slug').eq('user_id', user.id).single()
  if (!wedding) return NextResponse.json({ error: 'No wedding found' }, { status: 404 })

  const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).eq('is_active', true).single()
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  // Plans are one-time, lifetime unlocks, not recurring — an "upgrade" is
  // really "top up to the new plan's price." Charge only the difference so
  // a couple who already paid for Ember isn't billed the full Grand price
  // on top of what they already paid.
  const { data: activeSub } = await supabase
    .from('wedding_subscriptions')
    .select('plan_id, status, plans(price)')
    .eq('wedding_id', wedding.id)
    .eq('status', 'active')
    .maybeSingle()

  const currentPrice = (activeSub?.plans as unknown as { price: number } | null)?.price ?? 0
  const amount = plan.price - currentPrice
  if (activeSub && amount <= 0) {
    return NextResponse.json({ error: 'This wedding is already on an equal or higher plan.' }, { status: 400 })
  }

  // Short readable reference: nemi-<slug>-<last6 of timestamp>
  const shortTs = String(Date.now()).slice(-6)
  const reference = `nemi-${wedding.slug}-${shortTs}`
  // Send the couple back to whichever environment they actually checked
  // out from (production vs uat) — a static env var can't tell those
  // apart and previously sent every environment's callback to whatever
  // single URL it was configured with. Paystack can't reach localhost,
  // so that's the one case that still needs the env var fallback.
  const requestOrigin = req.nextUrl.origin
  const isLocal = requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1')
  const baseUrl = isLocal
    ? (process.env.PAYSTACK_CALLBACK_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://nemiplanner.xyz')
    : requestOrigin

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount, // kobo — full plan price on first purchase, difference on upgrade
      currency: 'NGN',
      reference,
      callback_url: `${baseUrl}/api/paystack/callback`,
      metadata: {
        wedding_id: wedding.id,
        plan_id: plan.id,
        plan_name: plan.name,
        user_id: user.id,
        previous_plan_id: activeSub?.plan_id ?? null,
      },
    }),
  })

  const data = await res.json()
  if (!data.status) {
    console.error('[Paystack initialize error]', JSON.stringify(data))
    return NextResponse.json({ error: data.message ?? 'Paystack error', detail: data }, { status: 400 })
  }

  // Record the checkout attempt — but only when there's no existing active
  // subscription. wedding_subscriptions holds one row per wedding, so
  // writing 'pending' here for an upgrade would clobber the couple's
  // current active row the instant they click "Upgrade," and if they
  // abandon checkout (closed tab, failed payment) it stays stuck at
  // 'pending' forever even though their original plan was fully paid.
  // The real activation write happens in the callback/webhook on success,
  // sourced from Paystack's own verified metadata — this row is only for
  // the "Incomplete" tracking stat on a first-time subscribe.
  if (!activeSub) {
    await supabase.from('wedding_subscriptions').upsert({
      wedding_id: wedding.id,
      plan_id: plan.id,
      paystack_reference: reference,
      status: 'pending',
    }, { onConflict: 'wedding_id' })
  }

  return NextResponse.json({ authorization_url: data.data.authorization_url })
}
