'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

const slides = [
  {
    src: '/screenshots/guest-list.png',
    caption: 'Your guest list, organized',
    sub: 'Filter, search, and export in seconds',
  },
  {
    src: '/screenshots/registry.png',
    caption: 'Your gift registry, one page',
    sub: 'Physical gifts and cash — all tracked',
  },
  {
    src: '/screenshots/seating.png',
    caption: 'Seating made simple',
    sub: 'Assign tables when you\'re ready',
  },
  {
    src: '/screenshots/rsvp.png',
    caption: 'The RSVP your guests actually use',
    sub: '30 seconds to confirm attendance',
  },
]

export default function ScreenshotCarousel() {
  const [active, setActive] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = () => {
    timer.current = setInterval(() => setActive(a => (a + 1) % slides.length), 3500)
  }
  const stop = () => { if (timer.current) clearInterval(timer.current) }

  useEffect(() => { start(); return stop }, [])

  return (
    <div className="max-w-4xl mx-auto px-5">
      {/* Laptop mockup frame */}
      <div
        className="relative mx-auto"
        style={{ maxWidth: 720 }}
        onMouseEnter={stop}
        onMouseLeave={start}
      >
        {/* Screen bezel */}
        <div className="bg-stone-800 rounded-2xl p-3 shadow-2xl shadow-stone-400/30">
          {/* Top bar dots */}
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
            <div className="flex-1 mx-2 h-4 bg-stone-700 rounded-full" />
          </div>
          {/* Screen */}
          <div className="relative overflow-hidden rounded-xl bg-stone-100" style={{ aspectRatio: '16/10' }}>
            {slides.map((slide, i) => (
              <div
                key={i}
                className="absolute inset-0 transition-opacity duration-700"
                style={{ opacity: i === active ? 1 : 0 }}
              >
                <Image
                  src={slide.src}
                  alt={slide.caption}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 720px"
                  priority={i === 0}
                />
                {/* Placeholder shown if image missing */}
                <div className="absolute inset-0 flex items-center justify-center bg-rose-50/50 opacity-0 group-[img-error]:opacity-100">
                  <p className="text-stone-400 text-sm">Screenshot coming soon</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Laptop base */}
        <div className="mx-auto mt-1 h-3 bg-stone-700 rounded-b-xl" style={{ width: '85%' }} />
        <div className="mx-auto h-1.5 bg-stone-600 rounded-b-lg" style={{ width: '95%' }} />
      </div>

      {/* Caption */}
      <div className="text-center mt-8 min-h-[48px]">
        <p className="font-semibold text-stone-800 text-base transition-all">{slides[active].caption}</p>
        <p className="text-sm text-stone-400 mt-1">{slides[active].sub}</p>
      </div>

      {/* Dot nav */}
      <div className="flex justify-center gap-2 mt-5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { stop(); setActive(i); start() }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? 'w-8 bg-rose-500' : 'w-1.5 bg-stone-300'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
