import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RegistryClient from './RegistryClient'
import type { RegistryItem, GiftClaim } from '@/lib/supabase/database.types'

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

  const { data: items } = await supabase
    .from('registry_items')
    .select('*, gift_claims(*)')
    .eq('wedding_id', wedding.id)
    .order('sort_order') as { data: ItemWithClaims[] | null }

  const totalClaimed = (items ?? []).reduce((n, i) => n + i.quantity_claimed, 0)
  const totalReceived = (items ?? []).flatMap(i => i.gift_claims).filter(c => c.is_received).length

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-stone-800 mb-1">Gift Registry</h1>
          <p className="text-stone-400 text-sm">Manage what guests can gift you</p>
        </div>
      </div>

      {(items ?? []).length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total items',   value: (items ?? []).length },
            { label: 'Items claimed', value: totalClaimed },
            { label: 'Received',      value: totalReceived },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5">
              <p className="font-serif text-3xl text-stone-800 mb-1">{value}</p>
              <p className="text-xs text-stone-400">{label}</p>
            </div>
          ))}
        </div>
      )}

      <RegistryClient items={items ?? []} />
    </div>
  )
}
