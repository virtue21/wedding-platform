import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AdminRegistryTabs from './AdminRegistryTabs'
import type { RegistryItem, GiftClaim, CashGiftReceipt } from '@/lib/supabase/database.types'

type ItemWithClaims = RegistryItem & { gift_claims: GiftClaim[] }

export default async function RegistryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: wedding } = await supabase
    .from('weddings').select('id').eq('user_id', user.id).single()

  if (!wedding) {
    return (
      <div className="text-center py-24">
        <p className="text-4xl mb-4">🎁</p>
        <h2 className="font-serif text-2xl text-stone-800 mb-2">Set up your wedding first</h2>
        <Link href="/setup" className="btn-primary">Go to Setup</Link>
      </div>
    )
  }

  const [itemsResult, receiptsResult] = await Promise.all([
    supabase
      .from('registry_items')
      .select('*, gift_claims(*)')
      .eq('wedding_id', wedding.id)
      .order('sort_order'),

    supabase
      .from('cash_gift_receipts')
      .select('*')
      .eq('wedding_id', wedding.id)
      .order('submitted_at', { ascending: false }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-stone-800 mb-1">Gift Registry</h1>
        <p className="text-stone-400 text-sm">Manage gifts and cash transfers from guests</p>
      </div>

      <AdminRegistryTabs
        items={(itemsResult.data ?? []) as ItemWithClaims[]}
        receipts={(receiptsResult.data ?? []) as CashGiftReceipt[]}
      />
    </div>
  )
}
