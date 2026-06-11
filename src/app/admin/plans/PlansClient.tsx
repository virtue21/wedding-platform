'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Plan } from '@/lib/supabase/database.types'
import type { PlanWithSubscription } from '@/lib/plans'

type Props = {
  plans: Plan[]
  planInfo: PlanWithSubscription
  weddingId: string
}

function formatPrice(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

function UsageBar({ label, used, cap }: { label: string; used: number; cap: number | null }) {
  if (cap === null) return (
    <div className="flex justify-between text-xs text-stone-500">
      <span>{label}</span><span className="text-emerald-500">{used} / Unlimited</span>
    </div>
  )
  const pct = Math.min(100, (used / cap) * 100)
  const isWarning = pct >= 80
  const isFull = pct >= 100
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-stone-500">{label}</span>
        <span className={isFull ? 'text-red-500 font-medium' : isWarning ? 'text-amber-500' : 'text-stone-400'}>{used}/{cap}</span>
      </div>
      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isFull ? 'bg-red-400' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function getPlanFeatures(plan: Plan): { label: string; included: boolean }[] {
  const guestLabel = plan.guest_cap ? `${plan.guest_cap} guests` : 'Unlimited guests'
  const registryLabel = plan.registry_item_cap ? `${plan.registry_item_cap} registry items` : 'Unlimited registry items'
  const tablesLabel = plan.table_cap ? `${plan.table_cap} tables` : 'Unlimited tables'
  let momentsLabel: string
  if (!plan.has_moments) {
    momentsLabel = 'No Moments wall'
  } else if (plan.moments_upload_cap) {
    momentsLabel = `${plan.moments_upload_cap} photo uploads`
  } else {
    momentsLabel = 'Unlimited photo uploads'
  }

  return [
    { label: guestLabel, included: true },
    { label: registryLabel, included: true },
    { label: tablesLabel, included: true },
    { label: momentsLabel, included: plan.has_moments },
    { label: 'Cover image', included: plan.has_cover_image },
    { label: 'Digital invite + QR code', included: plan.has_digital_iv },
  ]
}

export default function PlansClient({ plans, planInfo, weddingId }: Props) {
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubscribe(planId: string) {
    setSubscribing(planId)
    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        alert(data.error ?? 'Failed to initialize payment')
        setSubscribing(null)
      }
    } catch {
      alert('Something went wrong. Please try again.')
      setSubscribing(null)
    }
  }

  const currentPlanId = planInfo.plan?.id

  return (
    <div className="space-y-6">
      {/* No active subscription banner */}
      {!planInfo.isActive && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm text-amber-700">
          No active plan — subscribe to unlock all features
        </div>
      )}

      {/* Current plan usage */}
      {planInfo.isActive && planInfo.plan && (
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-stone-800">Current Plan: {planInfo.plan.name}</h2>
            <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full font-medium">Active</span>
          </div>
          <div className="space-y-3">
            <UsageBar label="Guests" used={planInfo.usage.guests} cap={planInfo.caps.guests} />
            <UsageBar label="Registry Items" used={planInfo.usage.registryItems} cap={planInfo.caps.registryItems} />
            <UsageBar label="Tables" used={planInfo.usage.tables} cap={planInfo.caps.tables} />
            {planInfo.plan.has_moments && (
              <UsageBar label="Moments" used={planInfo.usage.moments} cap={planInfo.caps.moments} />
            )}
          </div>
        </div>
      )}

      {/* Plans grid */}
      {plans.length === 0 ? (
        <div className="text-center py-16 text-stone-400 text-sm">
          No plans available yet. Check back soon.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {plans.map(plan => {
            const isCurrent = plan.id === currentPlanId
            const features = getPlanFeatures(plan)
            const isLoading = subscribing === plan.id

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border shadow-sm p-6 flex flex-col gap-4 transition-all ${
                  isCurrent
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : 'border-rose-50 hover:border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-xl text-stone-800">{plan.name}</h3>
                    <p className="text-2xl font-semibold text-rose-500 mt-1">{formatPrice(plan.price)}</p>
                  </div>
                  {isCurrent && (
                    <span className="text-xs px-2.5 py-1 bg-rose-50 text-rose-500 border border-rose-200 rounded-full font-medium shrink-0">
                      Current Plan
                    </span>
                  )}
                </div>

                <ul className="space-y-2 flex-1">
                  {features.map(f => (
                    <li key={f.label} className="flex items-center gap-2 text-sm">
                      <span className={f.included ? 'text-emerald-500' : 'text-stone-300'}>
                        {f.included ? '✓' : '✗'}
                      </span>
                      <span className={f.included ? 'text-stone-600' : 'text-stone-300'}>{f.label}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading || subscribing !== null}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                    isCurrent
                      ? 'border border-rose-200 text-rose-500 hover:border-rose-300 hover:bg-rose-50'
                      : 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-200'
                  }`}
                >
                  {isLoading ? 'Redirecting…' : isCurrent ? 'Renew / Switch' : 'Subscribe'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
