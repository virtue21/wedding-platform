'use client'

import { useState, useEffect, useCallback } from 'react'
import type { WeddingStorySlide } from '@/lib/supabase/database.types'

type Props = {
  slides: WeddingStorySlide[]
}

export default function StorySection({ slides }: Props) {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')

  const goTo = useCallback((idx: number, dir: 'next' | 'prev') => {
    if (animating || idx === current) return
    setAnimating(true)
    setDirection(dir)
    setTimeout(() => {
      setCurrent(idx)
      setAnimating(false)
    }, 320)
  }, [animating, current])

  const next = useCallback(() => goTo((current + 1) % slides.length, 'next'), [current, slides.length, goTo])
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length, 'prev'), [current, slides.length, goTo])

  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(next, 7000)
    return () => clearInterval(t)
  }, [slides.length, next])

  if (slides.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-6 py-10">
        {/* Beautiful empty state */}
        <div className="relative rounded-3xl overflow-hidden aspect-video w-full mb-6">
          <div className="absolute inset-0 bg-[#1a0a0f]" />
          <div className="absolute inset-0">
            <div className="absolute w-64 h-64 rounded-full bg-rose-900/40 blur-3xl top-[-20%] left-[-10%]" />
            <div className="absolute w-80 h-80 rounded-full bg-pink-900/30 blur-3xl bottom-[-20%] right-[-10%]" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <p className="text-4xl mb-4">💑</p>
            <p className="font-serif text-2xl text-white mb-2">Our Story</p>
            <p className="text-white/50 text-sm">Coming soon…</p>
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="font-serif text-lg text-stone-600">A love story worth telling</p>
          <p className="text-stone-400 text-sm">The couple&apos;s story will appear here soon</p>
        </div>
      </div>
    )
  }

  const slide = slides[current]
  const hasImage = !!slide.image_url

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 text-center">
        <p className="text-xs text-rose-300 tracking-widest uppercase mb-1">Our Journey</p>
        <h2 className="font-serif text-2xl text-stone-800">How It All Began</h2>
      </div>

      {/* Slide card */}
      <div className="mx-4 rounded-2xl overflow-hidden shadow-lg">
        <div className="relative aspect-video w-full">
          {/* Background */}
          {hasImage ? (
            <div className="absolute inset-0">
              <img src={slide.image_url!} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />
            </div>
          ) : (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-[#1a0a0f]" />
              <div className="absolute inset-0">
                <div className="absolute w-64 h-64 rounded-full bg-rose-900/40 blur-3xl top-[-20%] left-[-10%]" />
                <div className="absolute w-80 h-80 rounded-full bg-pink-900/30 blur-3xl bottom-[-20%] right-[-10%]" />
                <div className="absolute w-48 h-48 rounded-full bg-amber-900/20 blur-2xl top-[30%] right-[20%]" />
              </div>
              <div className="absolute inset-0 pointer-events-none select-none">
                {['top-[10%] left-[15%]','top-[20%] left-[80%]','top-[50%] left-[5%]',
                  'top-[70%] left-[70%]','top-[85%] left-[30%]','top-[35%] left-[55%]',
                  'top-[60%] left-[45%]','top-[15%] left-[45%]','top-[75%] left-[85%]',
                ].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-1 h-1 rounded-full bg-amber-200/60`} />
                ))}
              </div>
              <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice">
                <circle cx="200" cy="112" r="80" fill="none" stroke="#f9a8d4" strokeWidth="0.5" />
                <circle cx="200" cy="112" r="100" fill="none" stroke="#f9a8d4" strokeWidth="0.3" />
                <line x1="120" y1="112" x2="280" y2="112" stroke="#f9a8d4" strokeWidth="0.3" />
                <line x1="200" y1="32" x2="200" y2="192" stroke="#f9a8d4" strokeWidth="0.3" />
              </svg>
            </div>
          )}

          {/* Slide number */}
          <div className="absolute top-4 left-4 text-rose-300/80 text-xs tracking-widest uppercase">
            {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </div>

          {/* Navigation arrows */}
          {slides.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 text-white transition-colors text-xl">‹</button>
              <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center bg-black/30 hover:bg-black/50 text-white transition-colors text-xl">›</button>
            </>
          )}
        </div>

        {/* Slide text card — below the image */}
        <div
          className={`bg-white px-6 py-5 transition-all duration-300 ease-out ${
            animating
              ? direction === 'next' ? 'opacity-0 translate-x-3' : 'opacity-0 -translate-x-3'
              : 'opacity-100 translate-x-0'
          }`}
        >
          {slide.title && (
            <h3 className="font-serif text-xl text-stone-800 mb-2">{slide.title}</h3>
          )}
          <p className="text-stone-500 text-sm leading-relaxed">{slide.body}</p>
        </div>
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="flex justify-center gap-2 py-5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx, idx > current ? 'next' : 'prev')}
              className={`transition-all rounded-full ${
                idx === current ? 'w-5 h-2 bg-rose-400' : 'w-2 h-2 bg-rose-200 hover:bg-rose-300'
              }`}
            />
          ))}
        </div>
      )}

      {/* Decorative footer quote */}
      <div className="mx-6 mb-6 mt-2 p-5 bg-white rounded-2xl border border-rose-50 text-center">
        <p className="font-serif text-stone-400 italic text-sm leading-relaxed">
          &ldquo;Every love story is beautiful, but ours is my favourite.&rdquo;
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="h-px w-8 bg-rose-200" />
          <span className="text-rose-300 text-xs">❤</span>
          <div className="h-px w-8 bg-rose-200" />
        </div>
      </div>
    </div>
  )
}
