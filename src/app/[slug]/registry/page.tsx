import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RegistryTabs from './RegistryTabs'
import type { WeddingRow, RegistryItem, Guest, WeddingPaymentMethod } from '@/lib/supabase/database.types'

export default async function RegistryPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { guest_id?: string }
}) {
  const supabase = createClient()

  const { data: wedding } = await supabase
    .from('weddings')
    .select('*')
    .eq('slug', params.slug)
    .single() as { data: WeddingRow | null }

  if (!wedding) notFound()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('bride_name, groom_name')
    .eq('id', wedding.user_id)
    .single()

  const { data: items } = await supabase
    .from('registry_items')
    .select('*')
    .eq('wedding_id', wedding.id)
    .order('sort_order') as { data: RegistryItem[] | null }

  // Fetch payment methods; fall back to legacy weddings fields if none configured yet
  const { data: rawMethods } = await supabase
    .from('wedding_payment_methods')
    .select('*')
    .eq('wedding_id', wedding.id)
    .order('created_at') as { data: WeddingPaymentMethod[] | null }

  let paymentMethods: WeddingPaymentMethod[] = rawMethods ?? []

  // Legacy fallback: wedding table still has bank/crypto fields
  if (paymentMethods.length === 0 && (wedding.bank_name || wedding.crypto_address)) {
    const isCrypto = ['USDT','USDC'].includes(wedding.currency ?? '')
    paymentMethods = [{
      id: 'legacy',
      wedding_id: wedding.id,
      currency: wedding.currency ?? 'NGN',
      bank_name: isCrypto ? null : wedding.bank_name,
      bank_code: isCrypto ? null : (wedding.bank_code ?? null),
      account_number: isCrypto ? null : wedding.account_number,
      account_name: isCrypto ? null : wedding.account_name,
      crypto_chain: isCrypto ? wedding.crypto_chain : null,
      crypto_address: isCrypto ? wedding.crypto_address : null,
      sort_order: 0,
      created_at: '',
    }]
  }

  let sessionGuest: Pick<Guest, 'id' | 'full_name' | 'phone'> | null = null
  if (searchParams.guest_id) {
    const { data } = await supabase
      .from('guests')
      .select('id, full_name, phone')
      .eq('id', searchParams.guest_id)
      .eq('wedding_id', wedding.id)
      .single() as { data: Pick<Guest, 'id' | 'full_name' | 'phone'> | null }
    sessionGuest = data
  }

  const brideName = profile?.bride_name ?? 'Bride'
  const groomName = profile?.groom_name ?? 'Groom'

  return (
    <div className="min-h-screen bg-[#fdf8f4]">
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/${params.slug}`} className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-rose-400 transition-colors">
          ← Back
        </Link>
        <div className="mt-4 text-center">
          <p className="text-rose-400 text-xs tracking-widest uppercase mb-1">Gift Registry</p>
          <h1 className="font-serif text-3xl text-stone-800 mb-1">{brideName} <span className="text-rose-400">&amp;</span> {groomName}</h1>
          <p className="text-stone-400 text-sm">Help us start our new chapter together 💝</p>
        </div>
        {sessionGuest && (
          <p className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            Hi {sessionGuest.full_name.split(' ')[0]}! Your claims will be linked to your RSVP automatically.
          </p>
        )}
      </div>

      <RegistryTabs
        weddingId={wedding.id}
        paymentMethods={paymentMethods}
        items={items ?? []}
        sessionGuest={sessionGuest}
      />
    </div>
    </div>
  )
}
