import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { planId } = await req.json()
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: wedding } = await supabase.from('weddings').select('id').eq('user_id', user.id).single()
  if (!wedding) return NextResponse.json({ error: 'No wedding found' }, { status: 404 })

  const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).eq('is_active', true).single()
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const reference = `nemi_${wedding.id}_${Date.now()}`
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount: plan.price, // already in kobo
      currency: 'NGN',
      reference,
      callback_url: `${baseUrl}/api/paystack/callback`,
      metadata: {
        wedding_id: wedding.id,
        plan_id: plan.id,
        plan_name: plan.name,
        user_id: user.id,
      },
    }),
  })

  const data = await res.json()
  if (!data.status) {
    console.error('[Paystack initialize error]', JSON.stringify(data))
    return NextResponse.json({ error: data.message ?? 'Paystack error', detail: data }, { status: 400 })
  }

  // Create pending subscription record
  await supabase.from('wedding_subscriptions').upsert({
    wedding_id: wedding.id,
    plan_id: plan.id,
    paystack_reference: reference,
    status: 'pending',
  }, { onConflict: 'wedding_id' })

  return NextResponse.json({ authorization_url: data.data.authorization_url })
}
