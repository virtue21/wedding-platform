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
