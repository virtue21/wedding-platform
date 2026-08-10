'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { isValidSession, SUPERADMIN_COOKIE } from '@/lib/superadmin-session'

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function assertSuperadmin() {
  const cookieStore = cookies()
  const session = cookieStore.get(SUPERADMIN_COOKIE)
  if (!isValidSession(session?.value)) throw new Error('Unauthorized')
}

export async function pauseSubscription(subId: string) {
  assertSuperadmin()
  const sb = serviceClient()
  await sb.from('wedding_subscriptions').update({ status: 'paused' }).eq('id', subId)
  revalidatePath('/superadmin/subscriptions')
}

export async function resumeSubscription(subId: string) {
  assertSuperadmin()
  const sb = serviceClient()
  await sb.from('wedding_subscriptions').update({ status: 'active' }).eq('id', subId)
  revalidatePath('/superadmin/subscriptions')
}

export async function cancelSubscription(subId: string) {
  assertSuperadmin()
  const sb = serviceClient()
  await sb.from('wedding_subscriptions').update({ status: 'cancelled' }).eq('id', subId)
  revalidatePath('/superadmin/subscriptions')
}

// Re-verifies a Paystack reference directly against Paystack's API and
// force-activates the matching subscription. Recovery tool for payments
// that succeeded (debited, Paystack + confirmation emails sent) but never
// got written to wedding_subscriptions — e.g. the RLS bug where the
// activation write silently failed and nothing downstream noticed.
export async function reconcilePayment(reference: string) {
  assertSuperadmin()
  const trimmed = reference.trim()
  if (!trimmed) return { error: 'Enter a Paystack reference.' }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${trimmed}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  })
  const data = await res.json()

  if (!data.status || data.data?.status !== 'success') {
    return { error: `Paystack does not show this reference as a successful payment (status: ${data.data?.status ?? 'not found'}).` }
  }

  const { wedding_id, plan_id } = data.data.metadata ?? {}
  if (!wedding_id || !plan_id) {
    return { error: 'This transaction has no wedding_id/plan_id metadata — it may predate this checkout flow.' }
  }

  const amountKobo: number = data.data.amount ?? 0
  const sb = serviceClient()

  const { error } = await sb.from('wedding_subscriptions').upsert({
    wedding_id,
    plan_id,
    paystack_reference: trimmed,
    status: 'active',
    amount_paid: amountKobo,
    activated_at: new Date().toISOString(),
  }, { onConflict: 'wedding_id' })

  if (error) return { error: `Verified with Paystack, but the database write failed: ${error.message}` }

  await sb.from('weddings').update({ rsvp_enabled: true }).eq('id', wedding_id)
  revalidatePath('/superadmin/subscriptions')
  revalidatePath('/superadmin')
  revalidatePath(`/superadmin/customers/${wedding_id}`)

  return { success: true, amountKobo, weddingId: wedding_id }
}
