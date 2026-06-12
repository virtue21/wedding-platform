import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AdminRegistryTabs from './AdminRegistryTabs'
import SectionGuide from '@/components/SectionGuide'
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

  const [itemsResult, receiptsResult, subResult, methodsResult, activePlansResult] = await Promise.all([
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

    supabase
      .from('wedding_subscriptions')
      .select('plan_id, plans(registry_item_cap)')
      .eq('wedding_id', wedding.id)
      .eq('status', 'active')
      .single(),

    supabase
      .from('wedding_payment_methods')
      .select('currency')
      .eq('wedding_id', wedding.id),

    supabase.from('plans').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const noActivePlans = (activePlansResult.count ?? 0) === 0
  const rawRegistryCap = (subResult.data as { plans?: { registry_item_cap?: number | null } } | null)?.plans?.registry_item_cap ?? null
  // If no plans are active in the system, remove all limits
  const registryCap = noActivePlans ? null : rawRegistryCap
  const availableCurrencies = [...new Set((methodsResult.data ?? []).map(m => m.currency).filter(Boolean))] as string[]
  const itemCount = (itemsResult.data ?? []).length
  const atRegistryCap = registryCap !== null && itemCount >= registryCap

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-stone-800 mb-1">Gift Registry</h1>
        <p className="text-stone-400 text-sm">Manage gift items and track cash transfers from guests</p>
      </div>

      <SectionGuide
        icon="🎁"
        title="How the registry works"
        body="Add items you'd love as gifts. For each item, guests can either buy it directly (if you add a shop link) or send the cash equivalent to your bank account. Add your bank details in Setup so guests can see where to transfer to."
        tip="Add a variety of price points — not everyone has the same budget. Items stay visible even after they're fully claimed."
      />

      {atRegistryCap && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-700 flex items-center justify-between gap-4">
          <span>⚠️ You&apos;ve reached your plan limit of {registryCap} registry items. Upgrade to add more.</span>
          <Link href="/admin/plans" className="text-amber-700 font-medium underline whitespace-nowrap">Upgrade →</Link>
        </div>
      )}

      <AdminRegistryTabs
        items={(itemsResult.data ?? []) as ItemWithClaims[]}
        receipts={(receiptsResult.data ?? []) as CashGiftReceipt[]}
        atRegistryCap={atRegistryCap}
        registryCap={registryCap}
        availableCurrencies={availableCurrencies}
      />
    </div>
  )
}
