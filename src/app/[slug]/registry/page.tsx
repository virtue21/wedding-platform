import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RegistryTabs from './RegistryTabs'
import type { WeddingRow, RegistryItem, Guest } from '@/lib/supabase/database.types'

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
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/${params.slug}`} className="text-sm text-stone-400 hover:text-stone-600">
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold text-stone-800 mt-3 mb-1">Gift Registry</h1>
        <p className="text-stone-500 text-sm">{brideName} &amp; {groomName}</p>
        {sessionGuest && (
          <p className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            Hi {sessionGuest.full_name.split(' ')[0]}! Your claims will be linked to your RSVP automatically.
          </p>
        )}
      </div>

      <RegistryTabs
        wedding={{
          id: wedding.id,
          bank_name: wedding.bank_name,
          account_number: wedding.account_number,
          account_name: wedding.account_name,
          currency: wedding.currency,
          crypto_chain: wedding.crypto_chain,
          crypto_address: wedding.crypto_address,
        }}
        items={items ?? []}
        sessionGuest={sessionGuest}
      />
    </div>
  )
}
