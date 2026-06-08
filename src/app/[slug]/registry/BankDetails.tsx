'use client'

import { useState, useRef } from 'react'
import { submitReceipt } from './actions'
import type { WeddingRow } from '@/lib/supabase/database.types'

type PaymentInfo = Pick<WeddingRow, 'id' | 'bank_name' | 'account_number' | 'account_name' | 'currency' | 'crypto_chain' | 'crypto_address'>

type Props = {
  wedding: PaymentInfo
  itemId?: string | null   // null = standalone gift not tied to item
  price?: number | null    // null = guest enters amount themselves
  guestName?: string | null
  guestPhone?: string | null
  trigger?: React.ReactNode // custom trigger button
}

const CURRENCY_SYMBOL: Record<string, string> = {
  NGN: '₦', USD: '$', GBP: '£', USDT: '', USDC: '',
}
const CRYPTO = ['USDT', 'USDC']

type Step = 'idle' | 'currency' | 'details' | 'receipt' | 'done'

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="ml-2 text-xs px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-500 font-medium transition-colors shrink-0"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

export default function BankDetails({ wedding, itemId, price, guestName, guestPhone, trigger }: Props) {
  const [step, setStep] = useState<Step>('idle')
  const [customAmount, setCustomAmount] = useState('')
  const [name, setName] = useState(guestName ?? '')
  const [phone, setPhone] = useState(guestPhone ?? '')
  const [note, setNote] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const isCrypto = CRYPTO.includes(wedding.currency)
  const symbol = CURRENCY_SYMBOL[wedding.currency] ?? ''
  const hasPayment = isCrypto ? !!wedding.crypto_address : !!wedding.bank_name
  const finalAmount = price ?? (customAmount ? parseFloat(customAmount) : null)
  const formattedAmount = finalAmount
    ? `${symbol}${finalAmount.toLocaleString()}${isCrypto ? ` ${wedding.currency}` : ''}`
    : null

  if (!hasPayment) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    fd.set('wedding_id', wedding.id)
    if (itemId) fd.set('registry_item_id', itemId)
    if (finalAmount) fd.set('amount', String(finalAmount))
    fd.set('currency', wedding.currency)
    const result = await submitReceipt(fd)
    setSubmitting(false)
    if (!result.ok) { setError(result.error); return }
    setStep('done')
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { alert('File must be under 5 MB.'); e.target.value = ''; return }
    setPreview(URL.createObjectURL(f))
  }

  const close = () => { setStep('idle'); setPreview(null); setError('') }

  if (step === 'done') {
    return (
      <div className="mt-3 w-full p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
        <span className="text-base">✅</span>
        Receipt submitted! The couple will confirm once they receive your transfer.
      </div>
    )
  }

  return (
    <div className="mt-3 w-full">
      {step === 'idle' && (
        trigger
          ? <div onClick={() => setStep('currency')} className="cursor-pointer">{trigger}</div>
          : (
            <button onClick={() => setStep('currency')} className="text-xs font-medium text-stone-600 hover:text-stone-900 underline underline-offset-2">
              Send cash equivalent
            </button>
          )
      )}

      {/* Step 1 — Currency selection */}
      {step === 'currency' && (
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-stone-700 uppercase tracking-wide">Select currency</p>
            <button onClick={close} className="text-stone-400 text-xs hover:text-stone-600">✕</button>
          </div>
          <p className="text-xs text-stone-400">Choose how you&apos;d like to send your gift.</p>
          <button
            onClick={() => setStep('details')}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-rose-200 hover:border-rose-400 rounded-xl transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{isCrypto ? '🔗' : '🏦'}</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-stone-800">{wedding.currency}</p>
                <p className="text-xs text-stone-400">{isCrypto ? `${wedding.crypto_chain ?? ''} wallet` : `${wedding.bank_name ?? 'Bank transfer'}`}</p>
              </div>
            </div>
            <span className="text-rose-400 text-lg group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      )}

      {/* Step 2 — Payment details */}
      {step === 'details' && (
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-stone-700 uppercase tracking-wide">
              {isCrypto ? 'Crypto transfer' : 'Bank transfer'}
            </p>
            <button onClick={close} className="text-stone-400 text-xs hover:text-stone-600">✕</button>
          </div>

          {/* Amount — fixed or custom */}
          {price ? (
            <p className="text-xl font-bold text-stone-800">{formattedAmount}</p>
          ) : (
            <div>
              <label className="block text-xs text-stone-500 mb-1">Amount ({wedding.currency})</label>
              <input
                type="number"
                min={0}
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                placeholder="Enter amount…"
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
          )}

          {/* Details */}
          {isCrypto ? (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Chain</span>
                <span className="font-medium text-stone-800 capitalize">{wedding.crypto_chain ?? '—'}</span>
              </div>
              <div>
                <p className="text-stone-500 mb-1">Wallet address</p>
                <div className="flex items-center gap-1">
                  <p className="font-mono text-stone-900 bg-white border border-stone-200 rounded-lg px-2.5 py-2 break-all flex-1 select-all text-xs">
                    {wedding.crypto_address}
                  </p>
                  <CopyButton value={wedding.crypto_address ?? ''} />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Bank</span>
                <span className="font-medium text-stone-800">{wedding.bank_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Account number</span>
                <div className="flex items-center">
                  <span className="font-mono font-semibold text-stone-900 select-all">{wedding.account_number}</span>
                  <CopyButton value={wedding.account_number ?? ''} />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Account name</span>
                <span className="font-medium text-stone-800">{wedding.account_name}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setStep('receipt')}
            className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium rounded-xl transition-colors"
          >
            I&apos;ve made the transfer → Upload receipt
          </button>
        </div>
      )}

      {/* Step 3 — Receipt upload */}
      {step === 'receipt' && (
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-stone-700 uppercase tracking-wide">Upload receipt</p>
            <button type="button" onClick={() => setStep('details')} className="text-stone-400 text-xs hover:text-stone-600">← Back</button>
          </div>

          {!guestName && (
            <div>
              <label className="block text-xs text-stone-500 mb-1">Your name *</label>
              <input name="guest_name" required value={name} onChange={e => setName(e.target.value)} placeholder="Ada Okafor"
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-200" />
            </div>
          )}
          {guestName && <input type="hidden" name="guest_name" value={guestName} />}

          {!guestPhone && (
            <div>
              <label className="block text-xs text-stone-500 mb-1">Phone number</label>
              <input name="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+2348012345678"
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-200" />
            </div>
          )}
          {guestPhone && <input type="hidden" name="phone" value={guestPhone} />}

          <div>
            <label className="block text-xs text-stone-500 mb-1">Receipt screenshot *</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative w-full aspect-video rounded-xl border-2 border-dashed border-stone-200 bg-white overflow-hidden cursor-pointer hover:border-rose-300 transition-colors flex items-center justify-center"
            >
              {preview
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={preview} alt="Receipt" className="w-full h-full object-contain" />
                : <div className="text-center p-4"><p className="text-2xl mb-1">📎</p><p className="text-xs text-stone-400">Tap to attach screenshot</p><p className="text-xs text-stone-300 mt-0.5">JPG, PNG · max 5 MB</p></div>
              }
            </div>
            <input ref={fileRef} name="receipt" type="file" accept="image/*" required className="hidden" onChange={handleFile} />
          </div>

          <div>
            <label className="block text-xs text-stone-500 mb-1">Note (optional)</label>
            <input name="note" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Sent from GTBank app"
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-200" />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button type="submit" disabled={submitting}
            className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-colors">
            {submitting ? 'Submitting…' : 'Submit receipt'}
          </button>
        </form>
      )}
    </div>
  )
}
