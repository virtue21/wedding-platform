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

  const next = () => goTo((current + 1) % slides.length, 'next')
  const prev = () => goTo((current - 1 + slides.length) % slides.length, 'prev')

  // Auto-advance every 7 seconds
  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(next, 7000)
    return () => clearInterval(t)
  }, [slides.length, next])

  if (slides.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-5xl mb-4">💑</p>
        <p className="font-serif text-xl text-stone-600">Our story is coming soon…</p>
        <p className="text-stone-400 text-sm mt-2">Check back after the wedding</p>
      </div>
    )
  }

  const slide = slides[current]
  const hasImage = !!slide.image_url

  return (
    <div className="max-w-lg mx-auto">
      {/* Slide card */}
      <div className="relative overflow-hidden aspect-video w-full">
        {/* Background */}
        {hasImage ? (
          <div className="absolute inset-0">
            <img src={slide.image_url!} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/10" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none select-none">
              <span className="absolute text-7xl top-4 left-6 rotate-12">🌸</span>
              <span className="absolute text-5xl top-12 right-8 -rotate-12">💕</span>
              <span className="absolute text-6xl bottom-8 left-4 -rotate-6">🌹</span>
              <span className="absolute text-4xl bottom-4 right-6 rotate-6">✨</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div
          className={`absolute inset-0 flex flex-col justify-end p-8 transition-all duration-300 ease-out ${
            animating
              ? direction === 'next'
                ? 'opacity-0 translate-x-4'
                : 'opacity-0 -translate-x-4'
              : 'opacity-100 translate-x-0'
          }`}
        >
          {/* Slide number badge */}
          <div className={`mb-4 ${hasImage ? 'text-white/60' : 'text-rose-300'} text-xs tracking-widest uppercase`}>
            {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </div>

          {slide.title && (
            <h2 className={`font-serif text-3xl leading-tight mb-3 ${hasImage ? 'text-white' : 'text-stone-800'}`}>
              {slide.title}
            </h2>
          )}
          <p className={`text-base leading-relaxed ${hasImage ? 'text-white/90' : 'text-stone-600'}`}>
            {slide.body}
          </p>
        </div>

        {/* Navigation arrows */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                hasImage ? 'bg-black/30 hover:bg-black/50 text-white' : 'bg-white/70 hover:bg-white text-stone-600'
              }`}
            >
              ‹
            </button>
            <button
              onClick={next}
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                hasImage ? 'bg-black/30 hover:bg-black/50 text-white' : 'bg-white/70 hover:bg-white text-stone-600'
              }`}
            >
              ›
            </button>
          </>
        )}
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

      {/* Slide list for desktop */}
      {slides.length > 1 && (
        <div className="px-4 pb-6 space-y-2 hidden sm:block">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => goTo(idx, idx > current ? 'next' : 'prev')}
              className={`w-full text-left px-4 py-3 rounded-xl transition-colors border ${
                idx === current
                  ? 'border-rose-200 bg-rose-50'
                  : 'border-transparent bg-white hover:bg-rose-50/50'
              }`}
            >
              <p className={`text-xs font-medium ${idx === current ? 'text-rose-400' : 'text-stone-300'}`}>
                Chapter {idx + 1}
              </p>
              {s.title && (
                <p className={`text-sm font-medium mt-0.5 ${idx === current ? 'text-stone-800' : 'text-stone-500'}`}>
                  {s.title}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
