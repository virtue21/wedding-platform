'use client'

import { useState, useRef } from 'react'
import { submitReceipt } from './actions'
import type { WeddingPaymentMethod } from '@/lib/supabase/database.types'

type Props = {
  weddingId: string
  paymentMethods: WeddingPaymentMethod[]
  itemId?: string | null
  price?: number | null
  guestName?: string | null
  guestPhone?: string | null
  trigger?: React.ReactNode
}

const CRYPTO_CURRENCIES = ['USDT', 'USDC']
const SYMBOL: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', USDT: '', USDC: '' }

function fmt(amount: number, pm: WeddingPaymentMethod) {
  const sym = SYMBOL[pm.currency] ?? ''
  const isCrypto = CRYPTO_CURRENCIES.includes(pm.currency)
  return `${sym}${amount.toLocaleString()}${isCrypto ? ` ${pm.currency}` : ''}`
}

// ── Copy icon ─────────────────────────────────────────────────────────────────
function CopyIcon({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      title={copied ? 'Copied!' : 'Copy'}
      onClick={async () => {
        await navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className={`ml-2 shrink-0 p-1.5 rounded-lg transition-colors ${
        copied ? 'bg-emerald-50 text-emerald-500' : 'bg-stone-100 hover:bg-rose-50 text-stone-400 hover:text-rose-500'
      }`}
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 8 6.5 12 13 4" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="stroke-current" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="9" height="12" rx="1.5" />
          <path d="M5 4H3.5A1.5 1.5 0 002 5.5v9A1.5 1.5 0 003.5 16H9a1.5 1.5 0 001.5-1.5V14" />
        </svg>
      )}
    </button>
  )
}

type Step = 'idle' | 'currency' | 'details' | 'receipt' | 'done'

export default function BankDetails({ weddingId, paymentMethods, itemId, price, guestName, guestPhone, trigger }: Props) {
  const [step, setStep]                 = useState<Step>('idle')
  const [selectedMethod, setSelected]   = useState<WeddingPaymentMethod | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [name, setName]                 = useState(guestName ?? '')
  const [phone, setPhone]               = useState(guestPhone ?? '')
  const [note, setNote]                 = useState('')
  const [preview, setPreview]           = useState<string | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState('')
  const fileRef                         = useRef<HTMLInputElement>(null)

  if (paymentMethods.length === 0) return null

  const isCrypto      = selectedMethod ? CRYPTO_CURRENCIES.includes(selectedMethod.currency) : false
  const finalAmount   = price ?? (customAmount ? parseFloat(customAmount) : null)
  const formattedAmt  = finalAmount && selectedMethod ? fmt(finalAmount, selectedMethod) : null

  function open() {
    if (paymentMethods.length === 1) {
      setSelected(paymentMethods[0])
      setStep('details')
    } else {
      setStep('currency')
    }
  }

  const close = () => { setStep('idle'); setPreview(null); setError(''); setSelected(null) }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true); setError('')
    const fd = new FormData(e.currentTarget)
    fd.set('wedding_id', weddingId)
    if (itemId) fd.set('registry_item_id', itemId)
    if (finalAmount) fd.set('amount', String(finalAmount))
    fd.set('currency', selectedMethod?.currency ?? 'NGN')
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
      {/* Trigger */}
      {step === 'idle' && (
        trigger
          ? <div onClick={open} className="cursor-pointer">{trigger}</div>
          : (
            <button onClick={open} className="text-xs font-medium text-stone-600 hover:text-stone-900 underline underline-offset-2">
              Send cash equivalent
            </button>
          )
      )}

      {/* Step 1 — Currency/method selection */}
      {step === 'currency' && (
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-stone-700 uppercase tracking-wide">Select currency</p>
            <button onClick={close} className="text-stone-400 hover:text-stone-600">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="2" x2="14" y2="14"/><line x1="14" y1="2" x2="2" y2="14"/></svg>
            </button>
          </div>
          <p className="text-xs text-stone-400">Choose how you&apos;d like to send your gift.</p>
          <div className="space-y-2">
            {paymentMethods.map(pm => {
              const crypto = CRYPTO_CURRENCIES.includes(pm.currency)
              return (
                <button
                  key={pm.id}
                  onClick={() => { setSelected(pm); setStep('details') }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-rose-100 hover:border-rose-400 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{crypto ? '🔗' : '🏦'}</span>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-stone-800">{pm.currency}</p>
                      <p className="text-xs text-stone-400">
                        {crypto ? `${pm.crypto_chain ?? 'Blockchain'} wallet` : (pm.bank_name ?? 'Bank transfer')}
                      </p>
                    </div>
                  </div>
                  <span className="text-rose-400 text-lg group-hover:translate-x-1 transition-transform">→</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 2 — Payment details */}
      {step === 'details' && selectedMethod && (
        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-stone-700 uppercase tracking-wide">
              {isCrypto ? 'Crypto transfer' : 'Bank transfer'} · {selectedMethod.currency}
            </p>
            <button onClick={close} className="text-stone-400 hover:text-stone-600">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="2" y1="2" x2="14" y2="14"/><line x1="14" y1="2" x2="2" y2="14"/></svg>
            </button>
          </div>

          {/* Amount */}
          {price ? (
            <p className="text-xl font-bold text-stone-800">{formattedAmt}</p>
          ) : (
            <div>
              <label className="block text-xs text-stone-500 mb-1">Amount ({selectedMethod.currency})</label>
              <input
                type="number" min={0}
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                placeholder="Enter amount…"
                className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
          )}

          {/* Bank details */}
          {!isCrypto && (
            <div className="space-y-2 text-xs bg-white border border-stone-100 rounded-xl p-3">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Bank</span>
                <span className="font-medium text-stone-800">{selectedMethod.bank_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Account name</span>
                <span className="font-medium text-stone-800">{selectedMethod.account_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Account number</span>
                <div className="flex items-center">
                  <span className="font-mono font-semibold text-stone-900 select-all">{selectedMethod.account_number}</span>
                  <CopyIcon value={selectedMethod.account_number ?? ''} />
                </div>
              </div>
            </div>
          )}

          {/* Crypto details */}
          {isCrypto && (
            <div className="space-y-2 text-xs bg-white border border-stone-100 rounded-xl p-3">
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Currency</span>
                <span className="font-medium text-stone-800">{selectedMethod.currency}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400">Chain</span>
                <span className="font-medium text-stone-800 capitalize">{selectedMethod.crypto_chain ?? '—'}</span>
              </div>
              <div>
                <p className="text-stone-400 mb-1.5">Wallet address</p>
                <div className="flex items-start gap-1">
                  <p className="font-mono text-stone-900 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-2 break-all flex-1 select-all text-xs leading-relaxed">
                    {selectedMethod.crypto_address}
                  </p>
                  <CopyIcon value={selectedMethod.crypto_address ?? ''} />
                </div>
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
