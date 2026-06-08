'use client'

import { useState, useEffect, useRef } from 'react'
import type { WeddingRow } from '@/lib/supabase/database.types'

const FIAT = ['NGN', 'USD', 'GBP'] as const
const CRYPTO = ['USDT', 'USDC'] as const
const CHAINS = ['ethereum', 'bsc', 'polygon', 'solana', 'tron', 'base'] as const

type Bank = { id: number; name: string; code: string }

type Props = {
  defaultCurrency?: WeddingRow['currency']
  defaultChain?: string | null
  defaultAddress?: string | null
  defaultBankName?: string | null
  defaultBankCode?: string | null
  defaultAccountNumber?: string | null
  defaultAccountName?: string | null
}

export default function CurrencyFields({
  defaultCurrency = 'NGN',
  defaultChain,
  defaultAddress,
  defaultBankName,
  defaultBankCode,
  defaultAccountNumber,
  defaultAccountName,
}: Props) {
  const [currency, setCurrency] = useState<WeddingRow['currency']>(defaultCurrency)
  const isCrypto = CRYPTO.includes(currency as typeof CRYPTO[number])
  const isNGN = currency === 'NGN'

  // NGN — Paystack bank state
  const [banks, setBanks] = useState<Bank[]>([])
  const [banksLoading, setBanksLoading] = useState(false)
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [accountNumber, setAccountNumber] = useState(defaultAccountNumber ?? '')
  const [accountName, setAccountName] = useState(defaultAccountName ?? '')
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const verifyTimeout = useRef<NodeJS.Timeout>()

  // Load banks when NGN is selected
  useEffect(() => {
    if (!isNGN || banks.length > 0) return
    setBanksLoading(true)
    fetch('/api/paystack/banks')
      .then(r => r.json())
      .then(({ banks: list }: { banks: Bank[] }) => {
        setBanks(list)
        if (defaultBankCode) {
          const match = list.find(b => b.code === defaultBankCode)
          if (match) setSelectedBank(match)
        } else if (defaultBankName) {
          const match = list.find(b => b.name === defaultBankName)
          if (match) setSelectedBank(match)
        }
      })
      .finally(() => setBanksLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNGN])

  // Auto-verify account number (NGN only)
  useEffect(() => {
    clearTimeout(verifyTimeout.current)
    if (!isNGN || accountNumber.length !== 10 || !selectedBank) {
      if (accountNumber.length > 0 && accountNumber.length < 10) {
        setAccountName('')
        setVerifyError('')
      }
      return
    }

    verifyTimeout.current = setTimeout(async () => {
      setVerifying(true)
      setVerifyError('')
      setAccountName('')
      try {
        const res = await fetch(`/api/paystack/resolve?account_number=${accountNumber}&bank_code=${selectedBank.code}`)
        const json = await res.json()
        if (json.account_name) setAccountName(json.account_name)
        else setVerifyError(json.error ?? 'Account not found')
      } catch {
        setVerifyError('Verification failed. Check your connection.')
      } finally {
        setVerifying(false)
      }
    }, 400)

    return () => clearTimeout(verifyTimeout.current)
  }, [accountNumber, selectedBank, isNGN])

  return (
    <div className="space-y-4">
      {/* Currency selector */}
      <div>
        <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">Currency</label>
        <div className="flex flex-wrap gap-2">
          {[...FIAT, ...CRYPTO].map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c as WeddingRow['currency'])}
              className={`px-3.5 py-1.5 rounded-xl border text-sm font-medium transition-colors ${
                currency === c
                  ? 'bg-rose-500 border-rose-500 text-white'
                  : 'border-rose-100 text-stone-500 hover:border-rose-200 bg-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <input type="hidden" name="currency" value={currency} />
      </div>

      {isCrypto && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Chain</label>
            <select name="crypto_chain" defaultValue={defaultChain ?? ''} className="input">
              <option value="">Select chain…</option>
              {CHAINS.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Wallet address</label>
            <input name="crypto_address" type="text" defaultValue={defaultAddress ?? ''} placeholder="0x…" className="input font-mono text-xs" />
          </div>
        </div>
      )}

      {isNGN && (
        /* NGN — Paystack auto-verify */
        <div className="space-y-3">
          <input type="hidden" name="bank_name" value={selectedBank?.name ?? ''} />
          <input type="hidden" name="bank_code" value={selectedBank?.code ?? ''} />
          <input type="hidden" name="account_name" value={accountName} />

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
                  setSelectedBank(bank)
                  setAccountName('')
                  setVerifyError('')
                }}
              >
                <option value="">Select bank…</option>
                {banks.map(b => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Account number</label>
            <div className="relative">
              <input
                name="account_number"
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={accountNumber}
                placeholder="0123456789"
                className="input font-mono pr-10"
                onChange={e => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
              {verifying && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!verifying && accountName && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Account name</label>
            {verifyError ? (
              <p className="text-sm text-red-500">{verifyError}</p>
            ) : (
              <div className={`input bg-stone-50 ${!accountName ? 'text-stone-400 italic text-sm' : 'text-stone-800 font-medium'}`}>
                {accountName || 'Auto-filled after verification…'}
              </div>
            )}
          </div>
        </div>
      )}

      {!isCrypto && !isNGN && (
        /* USD / GBP — manual fields */
        <div className="space-y-3">
          <p className="text-xs text-stone-400 bg-stone-50 px-3 py-2 rounded-xl border border-stone-100">
            Enter your {currency} bank details manually.
          </p>
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Bank name</label>
            <input name="bank_name" type="text" defaultValue={defaultBankName ?? ''} placeholder={currency === 'USD' ? 'Chase, Bank of America…' : 'Barclays, HSBC…'} className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Account number / IBAN</label>
            <input name="account_number" type="text" defaultValue={defaultAccountNumber ?? ''} placeholder={currency === 'USD' ? '000123456789' : 'GB29 NWBK 6016 1331 9268 19'} className="input font-mono text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Account name</label>
            <input name="account_name" type="text" defaultValue={defaultAccountName ?? ''} placeholder="Ada Okafor" className="input" />
          </div>
          {/* Hidden no-ops so server action always receives these fields */}
          <input type="hidden" name="bank_code" value="" />
        </div>
      )}
    </div>
  )
}
