'use client'

import { useState, useTransition } from 'react'
import RegistryClient from './RegistryClient'
import { toggleReceiptConfirmed } from './actions'
import type { RegistryItem, GiftClaim, CashGiftReceipt } from '@/lib/supabase/database.types'

type ItemWithClaims = RegistryItem & { gift_claims: GiftClaim[] }

// ── helpers ───────────────────────────────────────────────────────────────────
const SYMBOL: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£' }

function fmtAmount(amount: number | null, currency: string) {
  if (!amount) return null
  const sym  = SYMBOL[currency] ?? ''
  const isCr = !sym
  return `${sym}${amount.toLocaleString()}${isCr ? ` ${currency}` : ''}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── KPI cards ─────────────────────────────────────────────────────────────────
function CashKPIs({ receipts }: { receipts: CashGiftReceipt[] }) {
  const confirmed  = receipts.filter(r => r.is_confirmed)
  const pending    = receipts.filter(r => !r.is_confirmed).length
  const total      = receipts.length

  // Sum confirmed amounts by currency
  const byCurrency = confirmed.reduce<Record<string, number>>((acc, r) => {
    if (!r.amount) return acc
    const key = r.currency ?? 'NGN'
    acc[key] = (acc[key] ?? 0) + r.amount
    return acc
  }, {})
  const currencyLines = Object.entries(byCurrency)

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* Card 1 — Count */}
      <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5">
        <p className="text-xs text-stone-400 uppercase tracking-wide mb-2">Cash gifts</p>
        <p className="font-serif text-4xl text-stone-800 font-semibold leading-none mb-2">{total}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {confirmed.length > 0 && (
            <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">
              {confirmed.length} confirmed
            </span>
          )}
          {pending > 0 && (
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full">
              {pending} pending
            </span>
          )}
        </div>
      </div>

      {/* Card 2 — Value */}
      <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5">
        <p className="text-xs text-stone-400 uppercase tracking-wide mb-2">Total received</p>
        {currencyLines.length === 0 ? (
          <p className="text-stone-300 text-sm italic mt-1">No confirmed gifts yet</p>
        ) : (
          <div className="space-y-1">
            {currencyLines.map(([currency, total]) => (
              <p key={currency} className="font-serif text-xl text-stone-800 font-semibold leading-snug">
                {fmtAmount(total, currency)}
              </p>
            ))}
          </div>
        )}
        {currencyLines.length > 0 && (
          <p className="text-xs text-stone-400 mt-2">confirmed only</p>
        )}
      </div>
    </div>
  )
}

// ── Receipt row ───────────────────────────────────────────────────────────────
function ReceiptRow({ receipt }: { receipt: CashGiftReceipt }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${
      receipt.is_confirmed
        ? 'bg-emerald-50/40 border-emerald-100'
        : 'bg-white border-rose-50'
    }`}>
      {/* Thumbnail */}
      <a
        href={receipt.receipt_url}
        target="_blank"
        rel="noopener noreferrer"
        title="View full receipt"
        className="shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 hover:opacity-80 transition-opacity"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={receipt.receipt_url} alt="Receipt" className="w-full h-full object-cover" />
      </a>

      <div className="flex-1 min-w-0">
        {/* Top row: name + amount */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-stone-800">{receipt.guest_name}</p>
            {receipt.phone && <p className="text-xs text-stone-400">{receipt.phone}</p>}
          </div>
          {receipt.amount && (
            <p className="text-sm font-semibold text-stone-800 shrink-0">
              {fmtAmount(receipt.amount, receipt.currency)}
            </p>
          )}
        </div>

        {/* Note + date */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {receipt.note && (
            <p className="text-xs text-stone-400 italic flex-1 min-w-0 truncate">
              &ldquo;{receipt.note}&rdquo;
            </p>
          )}
          <p className="text-xs text-stone-300 shrink-0">{fmtDate(receipt.submitted_at)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2">
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

// ── Gift stats row ────────────────────────────────────────────────────────────
function GiftKPIs({ items }: { items: ItemWithClaims[] }) {
  const totalClaimed  = items.reduce((n, i) => n + i.quantity_claimed, 0)
  const totalReceived = items.flatMap(i => i.gift_claims).filter(c => c.is_received).length

  if (items.length === 0) return null

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[
        { label: 'Total items',   value: items.length },
        { label: 'Items claimed', value: totalClaimed },
        { label: 'Received',      value: totalReceived },
      ].map(({ label, value }) => (
        <div key={label} className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5">
          <p className="font-serif text-3xl text-stone-800 mb-1">{value}</p>
          <p className="text-xs text-stone-400">{label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function AdminRegistryTabs({
  items,
  receipts,
  atRegistryCap,
  availableCurrencies,
}: {
  items: ItemWithClaims[]
  receipts: CashGiftReceipt[]
  atRegistryCap?: boolean
  registryCap?: number | null
  availableCurrencies?: string[]
}) {
  const [tab, setTab] = useState<'gifts' | 'cash'>('gifts')

  return (
    <div>
      {/* Toggle */}
      <div className="flex gap-1 p-1 bg-stone-100 rounded-2xl mb-6 max-w-xs">
        <button
          onClick={() => setTab('gifts')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors ${
            tab === 'gifts'
              ? 'bg-white text-stone-800 shadow-sm'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          🎁 Gifts
        </button>
        <button
          onClick={() => setTab('cash')}
          className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors ${
            tab === 'cash'
              ? 'bg-white text-stone-800 shadow-sm'
              : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          💸 Cash
          {receipts.filter(r => !r.is_confirmed).length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-amber-400 text-white text-[10px] font-bold rounded-full">
              {receipts.filter(r => !r.is_confirmed).length}
            </span>
          )}
        </button>
      </div>

      {/* ── GIFTS TAB ── */}
      {tab === 'gifts' && (
        <>
          <GiftKPIs items={items} />
          <RegistryClient items={items} atRegistryCap={atRegistryCap} availableCurrencies={availableCurrencies} />
        </>
      )}

      {/* ── CASH TAB ── */}
      {tab === 'cash' && (
        <>
          <CashKPIs receipts={receipts} />

          {receipts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-rose-50">
              <p className="text-3xl mb-3">💸</p>
              <p className="font-serif text-lg text-stone-700 mb-1">No cash gifts yet</p>
              <p className="text-stone-400 text-sm">Receipt uploads from guests will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {receipts.map(r => <ReceiptRow key={r.id} receipt={r} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
