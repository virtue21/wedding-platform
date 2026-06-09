'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { deleteRegistryItem, toggleReceived } from './actions'
import RegistryItemForm from './RegistryItemForm'
import type { RegistryItem, GiftClaim } from '@/lib/supabase/database.types'

type ItemWithClaims = RegistryItem & { gift_claims: GiftClaim[] }

export default function RegistryClient({ items }: { items: ItemWithClaims[] }) {
  const [editing, setEditing] = useState<RegistryItem | null>(null)
  const [adding, setAdding] = useState(false)
  const [isPending, startTransition] = useTransition()

  const nextSortOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0

  return (
    <div>
      <div className="flex justify-end mb-5">
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          + Add item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-rose-50">
          <p className="text-4xl mb-3">🎁</p>
          <p className="font-serif text-xl text-stone-700 mb-2">No registry items yet</p>
          <p className="text-stone-400 text-sm mb-5">Add items guests can buy or send cash for.</p>
          <button onClick={() => setAdding(true)} className="btn-primary">Add first item</button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => {
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-rose-50 shadow-sm overflow-hidden">
                <div className="flex gap-4 p-5">
                  {item.image_url ? (
                    <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-rose-50">
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 shrink-0 rounded-xl bg-rose-50 flex items-center justify-center text-3xl">🎁</div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-stone-800">{item.name}</h3>
                        {item.description && <p className="text-xs text-stone-400 mt-0.5">{item.description}</p>}
                        <p className="text-sm font-semibold text-rose-500 mt-1">{item.currency === 'USD' ? '$' : item.currency === 'GBP' ? '£' : item.currency === 'EUR' ? '€' : '₦'}{item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => setEditing(item)} className="text-xs px-3 py-1.5 border border-rose-100 text-stone-500 rounded-lg hover:bg-rose-50 transition-colors">Edit</button>
                        <button
                          onClick={() => { if (confirm(`Delete "${item.name}"?`)) startTransition(() => deleteRegistryItem(item.id)) }}
                          disabled={isPending}
                          className="text-xs px-3 py-1.5 border border-red-100 text-red-400 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-1.5 bg-rose-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-300 rounded-full transition-all"
                          style={{ width: `${(item.quantity_claimed / item.quantity_needed) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-stone-400 whitespace-nowrap">
                        {item.quantity_claimed}/{item.quantity_needed} claimed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Claims */}
                {item.gift_claims.length > 0 && (
                  <div className="border-t border-rose-50 px-5 py-3 bg-rose-50/30">
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">Claims</p>
                    <div className="space-y-1.5">
                      {item.gift_claims.map(claim => (
                        <div key={claim.id} className="flex items-center justify-between gap-2">
                          <span className="text-sm text-stone-700">{claim.guest_name}</span>
                          <button
                            onClick={() => startTransition(() => toggleReceived(claim.id, claim.is_received))}
                            disabled={isPending}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                              claim.is_received
                                ? 'bg-green-50 border-green-100 text-green-600'
                                : 'bg-white border-stone-200 text-stone-400 hover:border-rose-200'
                            }`}
                          >
                            {claim.is_received ? '✓ Received' : 'Mark received'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {(adding || editing) && (
        <RegistryItemForm
          item={editing ?? undefined}
          nextSortOrder={nextSortOrder}
          onClose={() => { setAdding(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
