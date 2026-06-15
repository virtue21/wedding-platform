'use client'

import { useState } from 'react'
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function PlansClient({ plans, planInfo, weddingId: _weddingId }: Props) {
  const [subscribing, setSubscribing] = useState<string | null>(null)


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
        <div className="grid sm:grid-cols-2 gap-5">
          {plans.map((plan, idx) => {
            const isCurrent = plan.id === currentPlanId
            const currentSortOrder = planInfo.plan?.sort_order ?? 0
            const isUpgrade = plan.sort_order > currentSortOrder
            const isDowngrade = planInfo.isActive && plan.sort_order < currentSortOrder
            const features = getPlanFeatures(plan)
            const isLoading = subscribing === plan.id
            // Highlight the most popular / highest visible plan when user has no plan
            const isHighlighted = !planInfo.isActive && idx === plans.filter((_, i) => i === plans.length - 2).length

            // Hide downgrade options — one-off payment, can't go backwards
            if (isDowngrade) return null

            let ctaLabel = 'Get started'
            if (isLoading) ctaLabel = 'Redirecting…'
            else if (planInfo.isActive && isUpgrade) ctaLabel = 'Upgrade'

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl flex flex-col gap-5 overflow-hidden transition-all ${
                  isCurrent
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-200'
                    : isHighlighted
                    ? 'bg-stone-900 text-white shadow-lg shadow-stone-300'
                    : 'bg-white border border-stone-100 shadow-sm hover:shadow-md hover:border-rose-100'
                }`}
              >
                {/* Top section */}
                <div className="px-6 pt-6 pb-5 border-b border-white/10">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className={`font-serif text-lg font-semibold ${isCurrent || isHighlighted ? 'text-white' : 'text-stone-800'}`}>
                      {plan.name}
                    </h3>
                    {isCurrent && (
                      <span className="text-[11px] px-2 py-0.5 bg-white/20 text-white rounded-full font-medium shrink-0 border border-white/30">
                        Your plan
                      </span>
                    )}
                  </div>
                  <p className={`text-3xl font-bold tracking-tight ${isCurrent || isHighlighted ? 'text-white' : 'text-stone-900'}`}>
                    {formatPrice(plan.price)}
                    <span className={`text-sm font-normal ml-1 ${isCurrent || isHighlighted ? 'text-white/60' : 'text-stone-400'}`}>one-time</span>
                  </p>
                </div>

                {/* Features */}
                <ul className="px-6 space-y-2.5 flex-1">
                  {features.map(f => (
                    <li key={f.label} className="flex items-center gap-2.5 text-sm">
                      <span className={
                        f.included
                          ? (isCurrent || isHighlighted ? 'text-white/70' : 'text-emerald-500')
                          : (isCurrent || isHighlighted ? 'text-white/20' : 'text-stone-200')
                      }>
                        {f.included ? '✓' : '✗'}
                      </span>
                      <span className={
                        f.included
                          ? (isCurrent || isHighlighted ? 'text-white/90' : 'text-stone-700')
                          : (isCurrent || isHighlighted ? 'text-white/30' : 'text-stone-300')
                      }>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="px-6 pb-6">
                  {isCurrent ? (
                    <div className="w-full py-3 rounded-2xl text-sm font-semibold text-center text-white bg-white/20 border border-white/30">
                      ✓ Active plan
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isLoading || subscribing !== null}
                      className={`w-full py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50 ${
                        isHighlighted
                          ? 'bg-white text-stone-900 hover:bg-stone-50'
                          : 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-100'
                      }`}
                    >
                      {ctaLabel}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
