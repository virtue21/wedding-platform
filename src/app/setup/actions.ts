'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type WeddingRow = Database['public']['Tables']['weddings']['Row']
type ProfileRow = Database['public']['Tables']['user_profiles']['Row']

export async function saveWeddingSetup(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const slug = (formData.get('slug') as string).toLowerCase().trim().replace(/[^a-z0-9-]/g, '')
  const wedding_date = formData.get('wedding_date') as string
  const venue_name = formData.get('venue_name') as string
  const venue_address = (formData.get('venue_address') as string) || null
  const venue_lat = parseFloat(formData.get('venue_lat') as string) || null
  const venue_lng = parseFloat(formData.get('venue_lng') as string) || null
  const bank_name = (formData.get('bank_name') as string) || null
  const bank_code = (formData.get('bank_code') as string) || null
  const account_number = (formData.get('account_number') as string) || null
  const account_name = (formData.get('account_name') as string) || null
  const currency = (formData.get('currency') as WeddingRow['currency']) || 'NGN'
  const crypto_chain = (formData.get('crypto_chain') as string) || null
  const crypto_address = (formData.get('crypto_address') as string) || null
  const bride_name = formData.get('bride_name') as string
  const groom_name = formData.get('groom_name') as string

  await supabase
    .from('user_profiles')
    .update({ bride_name, groom_name } satisfies Partial<ProfileRow>)
    .eq('id', user.id)

  const { data: existing } = await supabase
    .from('weddings')
    .select('id')
    .eq('user_id', user.id)
    .single() as { data: Pick<WeddingRow, 'id'> | null }

  const payload = { slug, wedding_date, venue_name, venue_address, venue_lat, venue_lng, bank_name, bank_code, account_number, account_name, currency, crypto_chain, crypto_address }

  if (existing) {
    const { error } = await supabase.from('weddings').update(payload).eq('id', existing.id)
    if (error) {
      const msg = error.message.includes('unique') ? 'That URL slug is already taken. Please choose another.' : error.message
      return redirect(`/setup?error=${encodeURIComponent(msg)}`)
    }
  } else {
    const { error } = await supabase.from('weddings').insert({ user_id: user.id, ...payload })
    if (error) {
      const msg = error.message.includes('unique') ? 'That URL slug is already taken. Please choose another.' : error.message
      return redirect(`/setup?error=${encodeURIComponent(msg)}`)
    }

    const { data: newWedding } = await supabase
      .from('weddings').select('id').eq('user_id', user.id).single() as { data: Pick<WeddingRow, 'id'> | null }

    if (newWedding) {
      const defaults = ['Family', 'Church', 'Work', 'School', 'Friends']
      const categories = [
        ...defaults.map((label, i) => ({ wedding_id: newWedding.id, side: 'bride' as const, label, sort_order: i })),
        ...defaults.map((label, i) => ({ wedding_id: newWedding.id, side: 'groom' as const, label, sort_order: i })),
      ]
      await supabase.from('relationship_categories').insert(categories)
    }
  }

  revalidatePath('/setup')
  revalidatePath('/admin/guests')
  redirect('/setup?saved=1')
}

export async function uploadCoverImage(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const file = formData.get('cover_image') as File
  if (!file || file.size === 0) return redirect('/setup?error=No+file+selected')

  const ext = file.name.split('.').pop()
  const path = `${user.id}/cover.${ext}`

  const { error: uploadError } = await supabase.storage.from('cover-images').upload(path, file, { upsert: true })
  if (uploadError) return redirect(`/setup?error=${encodeURIComponent(uploadError.message)}`)

  const { data: { publicUrl } } = supabase.storage.from('cover-images').getPublicUrl(path)
  await supabase.from('weddings').update({ cover_image_url: publicUrl }).eq('user_id', user.id)

  revalidatePath('/setup')
  redirect('/setup?saved=1')
}
