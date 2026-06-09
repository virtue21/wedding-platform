'use client'

import { useEffect, useRef, useState } from 'react'

const steps = [
  { n: '1', label: 'Sign up', sub: 'Create your wedding in minutes' },
  { n: '2', label: 'Share your link', sub: 'One QR code for everything' },
  { n: '3', label: 'Manage', sub: 'Watch RSVPs come in live' },
]

export default function HowItWorksSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.25 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <section className="bg-white border-y border-stone-100 py-12 sm:py-20">
      <div className="max-w-5xl mx-auto px-5">
        <p className="text-center text-xs text-stone-400 uppercase tracking-widest font-medium mb-3">
          How it works
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl text-stone-800 text-center mb-10 sm:mb-14">
          Three steps.
        </h2>

        <div ref={ref} className="flex flex-col sm:flex-row gap-0 max-w-sm sm:max-w-2xl mx-auto w-full">
          {steps.map((step, i) => (
            <div
              key={step.n}
              className="flex sm:flex-col items-center gap-4 flex-1 sm:text-center py-2 sm:py-0"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(24px)',
                transition: `opacity 0.5s ease ${i * 0.18}s, transform 0.5s ease ${i * 0.18}s`,
              }}
            >
              {/* Number bubble with bounce animation */}
              <div
                className="w-14 h-14 rounded-full bg-rose-500 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-200 select-none"
                style={{
                  animation: visible
                    ? `stepBounce 0.65s cubic-bezier(0.36, 0.07, 0.19, 0.97) ${i * 0.2}s both`
                    : 'none',
                }}
              >
                {step.n}
              </div>

              {/* Text — left-aligned on mobile, centered on desktop */}
              <div className="text-left sm:text-center">
                <p className="font-semibold text-stone-800 text-base">{step.label}</p>
                <p className="text-sm text-stone-400 mt-0.5">{step.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
