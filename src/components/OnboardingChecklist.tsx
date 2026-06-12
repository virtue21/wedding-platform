'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Step = {
  id: string
  label: string
  description: string
  href: string
  done: boolean
}

type Props = {
  steps: Step[]
  slug: string
}

export default function OnboardingChecklist({ steps, slug }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDismissed(localStorage.getItem('onboarding_dismissed') === '1')
  }, [])

  const allDone = steps.every(s => s.done)
  const doneCount = steps.filter(s => s.done).length

  // Auto-hide once everything is done (after a delay)
  useEffect(() => {
    if (allDone && mounted) {
      const t = setTimeout(() => setDismissed(true), 5000)
      return () => clearTimeout(t)
    }
  }, [allDone, mounted])

  if (!mounted || dismissed) return null

  function handleDismiss() {
    localStorage.setItem('onboarding_dismissed', '1')
    setDismissed(true)
  }

  return (
    <div className="bg-white border border-rose-100 rounded-2xl shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-rose-50">
        <div className="flex items-center gap-3">
          <span className="text-xl">🗺️</span>
          <div>
            <p className="font-medium text-stone-800 text-sm">
              {allDone ? 'You\'re all set! 🎉' : 'Getting started'}
            </p>
            <p className="text-stone-400 text-xs mt-0.5">
              {allDone
                ? 'Your wedding is ready — share your link with guests.'
                : `${doneCount} of ${steps.length} steps complete`}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-stone-300 hover:text-stone-500 text-xs transition-colors"
        >
          {allDone ? 'Dismiss' : 'Hide'}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-rose-50">
        <div
          className="h-full bg-rose-400 transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="divide-y divide-stone-50">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-4 px-5 py-3.5">
            {/* Tick */}
            <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
              step.done ? 'bg-emerald-100 text-emerald-600' : 'border-2 border-stone-200'
            }`}>
              {step.done && '✓'}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.done ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs text-stone-400 mt-0.5">{step.description}</p>
              )}
            </div>

            {/* Action */}
            {!step.done && (
              <Link
                href={step.href}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-rose-500 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
              >
                Go →
              </Link>
            )}
          </div>
        ))}

        {/* Share link step — always last */}
        {allDone && (
          <div className="px-5 py-4 bg-rose-50/50">
            <p className="text-xs font-medium text-stone-500 mb-2">Your invite link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white border border-rose-100 rounded-lg px-3 py-2 text-rose-600 truncate">
                nemiplanner.xyz/{slug}
              </code>
              <CopyButton text={`https://nemiplanner.xyz/${slug}`} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="flex-shrink-0 px-3 py-2 text-xs font-medium bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
