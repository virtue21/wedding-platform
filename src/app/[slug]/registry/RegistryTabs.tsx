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

export default function RegistryTabs({ weddingId, paymentMethods, items, sessionGuest }: Props) {
  const [tab, setTab] = useState<'items' | 'cash'>('items')

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
          <p className="text-center text-stone-400 py-16 text-sm">No registry items yet.</p>
        ) : (
          <div className="space-y-4">
            {items.map(item => {
              const isClaimed = item.quantity_claimed >= item.quantity_needed
              // Use first fiat method for price display, fall back to crypto
              const primaryMethod = paymentMethods.find(m => !['USDT','USDC'].includes(m.currency)) ?? paymentMethods[0]
              const symbol = primaryMethod?.currency === 'NGN' ? '₦' : primaryMethod?.currency === 'USD' ? '$' : primaryMethod?.currency === 'GBP' ? '£' : ''
              const isCrypto = primaryMethod && ['USDT','USDC'].includes(primaryMethod.currency)
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-4 flex gap-4 ${isClaimed ? 'opacity-60' : 'border-stone-200'}`}
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
                      {symbol}{item.price.toLocaleString()}{isCrypto ? ` ${primaryMethod?.currency}` : ''}
                    </p>
                    <p className="text-xs text-stone-400">
                      {item.quantity_needed - item.quantity_claimed} of {item.quantity_needed} remaining
                    </p>

                    <div className="mt-3 flex flex-wrap gap-3 items-start">
                      {item.checkout_link && !isClaimed && (
                        <a
                          href={item.checkout_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-stone-700 hover:text-stone-900 underline underline-offset-2"
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
                        sessionGuestId={sessionGuest?.id ?? null}
                        sessionGuestName={sessionGuest?.full_name ?? null}
                        sessionGuestPhone={sessionGuest?.phone ?? null}
                        isClaimed={isClaimed}
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
