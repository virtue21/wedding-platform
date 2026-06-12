'use client'

import { useState } from 'react'
import Image from 'next/image'
import BankDetails from './BankDetails'
import ClaimButton from './ClaimButton'
import type { RegistryItem, WeddingPaymentMethod } from '@/lib/supabase/database.types'

type Props = {
  weddingId: string
  paymentMethods: WeddingPaymentMethod[]
  items: RegistryItem[]
  sessionGuest: { id: string; full_name: string; phone: string } | null
}

const SYMBOL: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' }

function itemSymbol(item: RegistryItem, fallbackMethod: WeddingPaymentMethod | undefined) {
  const currency = item.currency ?? fallbackMethod?.currency ?? 'NGN'
  if (['USDT', 'USDC'].includes(currency)) return { sym: '', suffix: ` ${currency}` }
  return { sym: SYMBOL[currency] ?? currency + ' ', suffix: '' }
}

export default function RegistryTabs({ weddingId, paymentMethods, items: initialItems, sessionGuest }: Props) {
  const [tab, setTab] = useState<'items' | 'cash'>('items')
  const [items, setItems] = useState<RegistryItem[]>(initialItems)

  function handleClaimed(itemId: string) {
    setItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, quantity_claimed: i.quantity_claimed + 1 } : i
    ))
  }

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-stone-100 rounded-2xl mb-6">
        <button
          onClick={() => setTab('items')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors ${
            tab === 'items'
              ? 'bg-white text-stone-800 shadow-sm'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          🎁 Gift Items
        </button>
        <button
          onClick={() => setTab('cash')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors ${
            tab === 'cash'
              ? 'bg-white text-stone-800 shadow-sm'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          💸 Cash Gift
        </button>
      </div>

      {/* Items tab */}
      {tab === 'items' && (
        items.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-3xl mb-3">💝</p>
            <p className="font-serif text-lg text-stone-600 mb-1">No gifts added yet</p>
            <p className="text-sm text-stone-400">Check back soon — the couple is still building their list.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => {
              const isClaimed = item.quantity_claimed >= item.quantity_needed
              const remaining = item.quantity_needed - item.quantity_claimed
              const fallbackMethod = paymentMethods.find(m => !['USDT','USDC'].includes(m.currency)) ?? paymentMethods[0]
              const { sym, suffix } = itemSymbol(item, fallbackMethod)
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-4 flex gap-4 shadow-sm ${isClaimed ? 'opacity-60 border-stone-100' : 'border-rose-50'}`}
                >
                  {item.image_url ? (
                    <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-stone-100">
                      <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 shrink-0 rounded-xl bg-stone-100 flex items-center justify-center text-2xl">
                      🎁
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-stone-800 text-sm leading-snug">{item.name}</h3>
                    {item.description && (
                      <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                    <p className="text-sm font-semibold text-stone-800 mt-1">
                      {sym}{item.price.toLocaleString()}{suffix}
                    </p>
                    <p className="text-xs text-stone-400">
                      {remaining} of {item.quantity_needed} remaining
                    </p>

                    <div className="mt-3 flex flex-wrap gap-3 items-start">
                      {item.checkout_link && !isClaimed && (
                        <a
                          href={item.checkout_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium px-3 py-1.5 border border-stone-200 rounded-lg text-stone-700 hover:border-stone-300 hover:text-stone-900 transition-colors"
                        >
                          Buy this gift →
                        </a>
                      )}

                      {!isClaimed && paymentMethods.length > 0 && (
                        <BankDetails
                          weddingId={weddingId}
                          paymentMethods={paymentMethods}
                          itemId={item.id}
                          price={item.price}
                          guestName={sessionGuest?.full_name ?? null}
                          guestPhone={sessionGuest?.phone ?? null}
                        />
                      )}

                      <ClaimButton
                        itemId={item.id}
                        itemName={item.name}
                        sessionGuestId={sessionGuest?.id ?? null}
                        sessionGuestName={sessionGuest?.full_name ?? null}
                        sessionGuestPhone={sessionGuest?.phone ?? null}
                        isClaimed={isClaimed}
                        onClaimed={() => handleClaimed(item.id)}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* Cash gift tab */}
      {tab === 'cash' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="text-center mb-6">
            <span className="text-4xl">💸</span>
            <h2 className="font-serif text-xl text-stone-800 mt-3 mb-1">Send a cash gift</h2>
            <p className="text-sm text-stone-400">Send any amount directly to the couple — not tied to a specific item.</p>
          </div>
          {paymentMethods.length === 0 ? (
            <p className="text-center text-sm text-stone-400">Cash gift details not set up yet.</p>
          ) : (
            <BankDetails
              weddingId={weddingId}
              paymentMethods={paymentMethods}
              itemId={null}
              price={null}
              guestName={sessionGuest?.full_name ?? null}
              guestPhone={sessionGuest?.phone ?? null}
              trigger={
                <button className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors">
                  Send cash gift →
                </button>
              }
            />
          )}
        </div>
      )}
    </div>
  )
}
