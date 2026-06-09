'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function saveRegistryItem(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wedding } = await supabase
    .from('weddings').select('id').eq('user_id', user.id).single()
  if (!wedding) redirect('/setup')

  const id = formData.get('id') as string | null
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || null
  const price = parseFloat(formData.get('price') as string)
  const currency = (formData.get('currency') as string) || 'NGN'
  const checkout_link = (formData.get('checkout_link') as string) || null
  const quantity_needed = parseInt(formData.get('quantity_needed') as string) || 1
  const sort_order = parseInt(formData.get('sort_order') as string) || 0
  const imageFile = formData.get('image') as File | null

  // Upload image if provided
  let image_url: string | undefined
  if (imageFile && imageFile.size > 0) {
    const itemId = id ?? crypto.randomUUID()
    const ext = imageFile.name.split('.').pop()
    const path = `${user.id}/${itemId}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('registry-images')
      .upload(path, imageFile, { upsert: true })
    if (!uploadErr) {
      image_url = supabase.storage.from('registry-images').getPublicUrl(path).data.publicUrl
    }
  }

  if (id) {
    await supabase.from('registry_items')
      .update({ name, description, price, currency, checkout_link, quantity_needed, sort_order, ...(image_url ? { image_url } : {}) })
      .eq('id', id)
  } else {
    await supabase.from('registry_items')
      .insert({ wedding_id: wedding.id, name, description, price, currency, checkout_link, quantity_needed, sort_order, ...(image_url ? { image_url } : {}) })
  }

  revalidatePath('/admin/registry')
}

export async function deleteRegistryItem(itemId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('registry_items').delete().eq('id', itemId)
  revalidatePath('/admin/registry')
}

export async function toggleReceiptConfirmed(receiptId: string, current: boolean) {
  const supabase = createClient()
  await supabase.from('cash_gift_receipts').update({ is_confirmed: !current }).eq('id', receiptId)
  revalidatePath('/admin/registry')
}

export async function toggleReceived(claimId: string, current: boolean) {
  const supabase = createClient()
  await supabase.from('gift_claims').update({ is_received: !current }).eq('id', claimId)
  revalidatePath('/admin/registry')
}

export async function uploadItemImage(itemId: string, formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const file = formData.get('image') as File
  if (!file || file.size === 0) return

  const ext = file.name.split('.').pop()
  const path = `${user.id}/${itemId}.${ext}`

  const { error } = await supabase.storage.from('registry-images').upload(path, file, { upsert: true })
  if (error) return

  const { data: { publicUrl } } = supabase.storage.from('registry-images').getPublicUrl(path)
  await supabase.from('registry_items').update({ image_url: publicUrl }).eq('id', itemId)
  revalidatePath('/admin/registry')
}
