'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addPaymentMethod, removePaymentMethod } from './actions'
import type { WeddingPaymentMethod } from '@/lib/supabase/database.types'

const FIAT   = ['NGN', 'USD', 'GBP'] as const
const CRYPTO = ['USDT', 'USDC']      as const
const ALL    = [...FIAT, ...CRYPTO]  as const
const CHAINS = ['ethereum', 'bsc', 'polygon', 'solana', 'tron', 'base'] as const

type Bank = { id: number; name: string; code: string }

// ── Small helpers ─────────────────────────────────────────────────────────────
function isCryptoCurrency(c: string) { return CRYPTO.includes(c as typeof CRYPTO[number]) }

function methodSummary(m: WeddingPaymentMethod) {
  if (isCryptoCurrency(m.currency)) {
    const addr = m.crypto_address ?? ''
    return `${m.crypto_chain ?? 'Blockchain'} · ${addr.length > 12 ? addr.slice(0, 6) + '…' + addr.slice(-4) : addr}`
  }
  return `${m.bank_name ?? ''} · ${m.account_number ?? ''}`
}

const CURRENCY_FLAGS: Record<string, string> = {
  NGN: '🇳🇬', USD: '🇺🇸', GBP: '🇬🇧', USDT: '🔗', USDC: '🔗',
}

// ── Add-method form ──────────────────────────────────────────────────────────
function AddMethodForm({
  takenCurrencies,
  onDone,
}: {
  takenCurrencies: string[]
  onDone: () => void
}) {
  const router = useRouter()
  const [currency, setCurrency] = useState<string>('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // NGN Paystack state
  const [banks, setBanks]               = useState<Bank[]>([])
  const [banksLoading, setBanksLoading] = useState(false)
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName]   = useState('')
  const [verifying, setVerifying]       = useState(false)
  const [verifyError, setVerifyError]   = useState('')
  const verifyTimeout = useRef<NodeJS.Timeout>()

  const isNGN    = currency === 'NGN'
  const isCrypto = isCryptoCurrency(currency)
  const available = ALL.filter(c => !takenCurrencies.includes(c))

  useEffect(() => {
    if (!isNGN || banks.length > 0) return
    setBanksLoading(true)
    fetch('/api/paystack/banks')
      .then(r => r.json())
      .then(({ banks: list }: { banks: Bank[] }) => setBanks(list))
      .finally(() => setBanksLoading(false))
  }, [isNGN, banks.length])

  useEffect(() => {
    clearTimeout(verifyTimeout.current)
    if (!isNGN || accountNumber.length !== 10 || !selectedBank) {
      if (accountNumber.length > 0 && accountNumber.length < 10) {
        setAccountName(''); setVerifyError('')
      }
      return
    }
    verifyTimeout.current = setTimeout(async () => {
      setVerifying(true); setVerifyError(''); setAccountName('')
      try {
        const res  = await fetch(`/api/paystack/resolve?account_number=${accountNumber}&bank_code=${selectedBank.code}`)
        const json = await res.json()
        if (json.account_name) setAccountName(json.account_name)
        else setVerifyError(json.error ?? 'Account not found')
      } catch { setVerifyError('Verification failed') }
      finally  { setVerifying(false) }
    }, 400)
    return () => clearTimeout(verifyTimeout.current)
  }, [accountNumber, selectedBank, isNGN])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    // Inject hidden values for NGN
    if (isNGN) {
      fd.set('bank_name',  selectedBank?.name ?? '')
      fd.set('bank_code',  selectedBank?.code ?? '')
      fd.set('account_name', accountName)
    }
    startTransition(async () => {
      const result = await addPaymentMethod(fd)
      if (result?.error) { setError(result.error); return }
      router.refresh()
      onDone()
    })
  }

  if (available.length === 0) {
    return (
      <p className="text-sm text-stone-400 italic py-2">
        All currencies are already configured.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
      {/* Currency picker */}
      <div>
        <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
          Currency
        </label>
        <div className="flex flex-wrap gap-2">
          {available.map(c => (
            <button
              key={c} type="button"
              onClick={() => { setCurrency(c); setAccountName(''); setVerifyError(''); setAccountNumber(''); setSelectedBank(null) }}
              className={`px-3.5 py-1.5 rounded-xl border text-sm font-medium transition-colors ${
                currency === c
                  ? 'bg-rose-500 border-rose-500 text-white'
                  : 'border-rose-100 text-stone-500 hover:border-rose-200 bg-white'
              }`}
            >{c}</button>
          ))}
        </div>
        <input type="hidden" name="currency" value={currency} />
      </div>

      {/* ── NGN ── */}
      {isNGN && currency && (
        <div className="space-y-3">
          <input type="hidden" name="bank_name"    value="" />
          <input type="hidden" name="bank_code"    value="" />
          <input type="hidden" name="account_name" value="" />
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Bank name</label>
            {banksLoading ? (
              <div className="input flex items-center gap-2 text-stone-400 text-sm">
                <div className="w-3.5 h-3.5 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
                Loading banks…
              </div>
            ) : (
              <select
                className="input"
                value={selectedBank?.code ?? ''}
                onChange={e => {
                  const bank = banks.find(b => b.code === e.target.value) ?? null
                  setSelectedBank(bank); setAccountName(''); setVerifyError('')
                }}
              >
                <option value="">Select bank…</option>
                {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Account number</label>
            <div className="relative">
              <input
                name="account_number" type="text" inputMode="numeric" maxLength={10}
                value={accountNumber} placeholder="0123456789"
                className="input font-mono pr-10"
                onChange={e => setAccountNumber(e.target.value.replace(/\D/g,'').slice(0,10))}
              />
              {verifying && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-4 h-4 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" /></div>}
              {!verifying && accountName && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Account name</label>
            {verifyError
              ? <p className="text-sm text-red-500">{verifyError}</p>
              : <div className={`input bg-stone-50 ${!accountName ? 'text-stone-400 italic text-sm' : 'text-stone-800 font-medium'}`}>
                  {accountName || 'Auto-filled after verification…'}
                </div>
            }
          </div>
        </div>
      )}

      {/* ── USD / GBP ── */}
      {!isCrypto && !isNGN && currency && (
        <div className="space-y-3">
          <input type="hidden" name="bank_code" value="" />
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Bank name</label>
            <input name="bank_name" type="text" placeholder={currency === 'USD' ? 'Chase, Bank of America…' : 'Barclays, HSBC…'} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Account number / IBAN</label>
            <input name="account_number" type="text" placeholder={currency === 'USD' ? '000123456789' : 'GB29 NWBK…'} className="input font-mono text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Account name</label>
            <input name="account_name" type="text" placeholder="Ada Okafor" className="input" />
          </div>
        </div>
      )}

      {/* ── Crypto ── */}
      {isCrypto && currency && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Chain</label>
            <select name="crypto_chain" className="input">
              <option value="">Select chain…</option>
              {CHAINS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Wallet address</label>
            <input name="crypto_address" type="text" placeholder="0x…" className="input font-mono text-xs" />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {currency && (
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={isPending || !currency}
            className="btn-primary disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save method'}
          </button>
          <button type="button" onClick={onDone} className="btn-ghost">
            Cancel
          </button>
        </div>
      )}
    </form>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function PaymentMethodsSection({
  weddingId,
  initialMethods,
}: {
  weddingId: string | null
  initialMethods: WeddingPaymentMethod[]
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const takenCurrencies = initialMethods.map(m => m.currency)

  async function handleDelete(id: string) {
    setDeletingId(id)
    await removePaymentMethod(id)
    router.refresh()
    setDeletingId(null)
  }

  return (
    <div className="space-y-4">
      {/* Existing methods */}
      {initialMethods.length > 0 && (
        <div className="space-y-2">
          {initialMethods.map(m => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-rose-50 rounded-xl"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg shrink-0">{CURRENCY_FLAGS[m.currency] ?? '🏦'}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-800">{m.currency}</p>
                  <p className="text-xs text-stone-400 truncate">{methodSummary(m)}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(m.id)}
                disabled={deletingId === m.id}
                className="shrink-0 text-xs text-stone-300 hover:text-red-400 transition-colors disabled:opacity-50 px-2 py-1"
              >
                {deletingId === m.id ? '…' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {initialMethods.length === 0 && !showForm && (
        <p className="text-sm text-stone-400 italic">
          No payment methods configured yet. Add at least one so guests can send cash gifts.
        </p>
      )}

      {/* Add form */}
      {showForm && weddingId ? (
        <div className="border border-rose-100 rounded-2xl p-4 bg-rose-50/30">
          <p className="text-sm font-medium text-stone-700 mb-4">Add payment method</p>
          <AddMethodForm
            takenCurrencies={takenCurrencies}
            onDone={() => setShowForm(false)}
          />
        </div>
      ) : !weddingId ? (
        <p className="text-xs text-stone-400 italic">
          Save your wedding details first, then add payment methods.
        </p>
      ) : takenCurrencies.length < ALL.length ? (
        !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-ghost text-sm"
          >
            + Add payment method
          </button>
        )
      ) : null}
    </div>
  )
}
