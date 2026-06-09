'use client'

import { useTransition } from 'react'
import { toggleReceiptConfirmed } from './actions'
import type { CashGiftReceipt } from '@/lib/supabase/database.types'

const SYMBOL: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', USDT: '', USDC: '' }

function fmt(amount: number | null, currency: string) {
  if (!amount) return '—'
  const sym = SYMBOL[currency] ?? ''
  return `${sym}${amount.toLocaleString()}${!sym ? ` ${currency}` : ''}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Totals per currency ───────────────────────────────────────────────────────
function Totals({ receipts }: { receipts: CashGiftReceipt[] }) {
  const confirmed = receipts.filter(r => r.is_confirmed && r.amount)
  const pending   = receipts.filter(r => !r.is_confirmed).length

  // Sum confirmed amounts by currency
  const byCurrency = confirmed.reduce<Record<string, number>>((acc, r) => {
    const key = r.currency ?? 'NGN'
    acc[key] = (acc[key] ?? 0) + (r.amount ?? 0)
    return acc
  }, {})

  const entries = Object.entries(byCurrency)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
      {entries.length === 0 ? (
        <div className="col-span-full bg-white rounded-2xl border border-rose-50 p-5 text-center">
          <p className="text-sm text-stone-300">No confirmed cash gifts yet.</p>
        </div>
      ) : (
        entries.map(([currency, total]) => (
          <div key={currency} className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5">
            <p className="text-xs text-stone-400 mb-1 uppercase tracking-wide">{currency}</p>
            <p className="font-serif text-2xl text-stone-800 font-semibold">
              {fmt(total, currency)}
            </p>
            <p className="text-xs text-emerald-500 mt-0.5">confirmed</p>
          </div>
        ))
      )}
      {pending > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-xs text-amber-500 mb-1 uppercase tracking-wide">Pending</p>
          <p className="font-serif text-2xl text-amber-700">{pending}</p>
          <p className="text-xs text-amber-400 mt-0.5">awaiting confirmation</p>
        </div>
      )}
    </div>
  )
}

// ── Receipt row ───────────────────────────────────────────────────────────────
function ReceiptRow({ receipt }: { receipt: CashGiftReceipt }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${
      receipt.is_confirmed ? 'bg-emerald-50/40 border-emerald-100' : 'bg-white border-rose-50'
    }`}>

      {/* Receipt image thumbnail */}
      <a
        href={receipt.receipt_url}
        target="_blank"
        rel="noopener noreferrer"
        title="View receipt"
        className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 hover:opacity-80 transition-opacity"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={receipt.receipt_url}
          alt="Receipt"
          className="w-full h-full object-cover"
        />
      </a>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-stone-800">{receipt.guest_name}</p>
            {receipt.phone && (
              <p className="text-xs text-stone-400">{receipt.phone}</p>
            )}
          </div>

          {/* Amount badge */}
          <div className="text-right shrink-0">
            <p className={`text-sm font-semibold ${receipt.amount ? 'text-stone-800' : 'text-stone-300'}`}>
              {fmt(receipt.amount, receipt.currency)}
            </p>
            <p className="text-xs text-stone-400">{receipt.currency}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {receipt.note && (
            <p className="text-xs text-stone-400 italic flex-1 min-w-0 truncate">
              &ldquo;{receipt.note}&rdquo;
            </p>
          )}
          <p className="text-xs text-stone-300 shrink-0">{formatDate(receipt.submitted_at)}</p>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <button
            disabled={isPending}
            onClick={() => startTransition(() => toggleReceiptConfirmed(receipt.id, receipt.is_confirmed))}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 ${
              receipt.is_confirmed
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-white'
                : 'bg-white border-stone-200 text-stone-500 hover:border-emerald-200 hover:text-emerald-700'
            }`}
          >
            {receipt.is_confirmed ? '✓ Confirmed' : 'Mark as received'}
          </button>

          <a
            href={receipt.receipt_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-rose-400 hover:text-rose-600 underline underline-offset-2 transition-colors"
          >
            View receipt ↗
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function CashGiftsSection({ receipts }: { receipts: CashGiftReceipt[] }) {
  return (
    <div>
      {/* Section header */}
      <div className="mb-6">
        <h2 className="font-serif text-2xl text-stone-800 mb-1">Cash Gifts</h2>
        <p className="text-stone-400 text-sm">
          Receipts submitted by guests. Confirm once you&apos;ve received the transfer.
        </p>
      </div>

      {/* Totals */}
      <Totals receipts={receipts} />

      {/* Receipt list */}
      {receipts.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-rose-50">
          <p className="text-3xl mb-3">💸</p>
          <p className="font-serif text-lg text-stone-700 mb-1">No cash gifts yet</p>
          <p className="text-stone-400 text-sm">Receipts submitted by guests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {receipts.map(r => (
            <ReceiptRow key={r.id} receipt={r} />
          ))}
        </div>
      )}
    </div>
  )
}
