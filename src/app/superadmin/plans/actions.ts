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

export async function togglePlan(id: string, isActive: boolean) {
  assertSuperadmin()
  const sb = serviceClient()
  await sb.from('plans').update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/superadmin/plans')
  revalidatePath('/admin/plans')
}

export async function updatePlan(id: string, data: {
  name: string
  price: number
  guest_cap: number | null
  registry_item_cap: number | null
  table_cap: number | null
  has_moments: boolean
  moments_upload_cap: number | null
  has_story_images: boolean
}) {
  assertSuperadmin()
  const sb = serviceClient()
  await sb.from('plans').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/superadmin/plans')
  revalidatePath('/admin/plans')
}
