'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export type ClaimResult =
  | { ok: true }
  | { ok: false; error: string }

export async function claimGift(
  itemId: string,
  guestName: string,
  guestPhone: string | null,
  guestId: string | null,
): Promise<ClaimResult> {
  const supabase = createClient()

  const { error } = await supabase.rpc('claim_gift', {
    item_id: itemId,
    claimer_name: guestName,
    claimer_phone: guestPhone,
    p_guest_id: guestId,
  })

  if (error) {
    const msg = error.message.includes('fully claimed')
      ? 'Sorry, this item has already been fully claimed.'
      : 'Something went wrong. Please try again.'
    return { ok: false, error: msg }
  }

  return { ok: true }
}

export type ReceiptResult =
  | { ok: true }
  | { ok: false; error: string }

export async function submitReceipt(formData: FormData): Promise<ReceiptResult> {
  // Use service role so unauthenticated guests can upload
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const wedding_id = formData.get('wedding_id') as string
  const registry_item_id = (formData.get('registry_item_id') as string) || null
  const guest_name = formData.get('guest_name') as string
  const phone = (formData.get('phone') as string) || null
  const amount = parseFloat(formData.get('amount') as string) || null
  const currency = (formData.get('currency') as string) || 'NGN'
  const note = (formData.get('note') as string) || null
  const file = formData.get('receipt') as File | null

  if (!file || file.size === 0) return { ok: false, error: 'Please attach your receipt screenshot.' }
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: 'File must be under 5 MB.' }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${wedding_id}/${Date.now()}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('cash-receipts')
    .upload(path, file, { upsert: false })

  if (uploadErr) return { ok: false, error: 'Upload failed. Please try again.' }

  const { data: { publicUrl } } = supabase.storage.from('cash-receipts').getPublicUrl(path)

  const { error: insertErr } = await supabase.from('cash_gift_receipts').insert({
    wedding_id,
    registry_item_id,
    guest_name,
    phone,
    amount,
    currency,
    note,
    receipt_url: publicUrl,
  })

  if (insertErr) return { ok: false, error: 'Could not save receipt. Please try again.' }

  return { ok: true }
}
