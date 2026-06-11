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

export async function setSubscriptionStatus(subId: string, status: 'active' | 'paused' | 'cancelled', weddingId: string) {
  assertSuperadmin()
  const sb = serviceClient()
  await sb.from('wedding_subscriptions').update({ status }).eq('id', subId)
  revalidatePath(`/superadmin/customers/${weddingId}`)
  revalidatePath('/superadmin/customers')
  revalidatePath('/superadmin/subscriptions')
}

export async function toggleRsvp(weddingId: string, enabled: boolean) {
  assertSuperadmin()
  const sb = serviceClient()
  await sb.from('weddings').update({ rsvp_enabled: enabled }).eq('id', weddingId)
  revalidatePath(`/superadmin/customers/${weddingId}`)
  revalidatePath('/superadmin/customers')
}
