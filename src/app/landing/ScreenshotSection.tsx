'use client'

import { useEffect, useRef, useState } from 'react'

// ── Admin UI Mockups ───────────────────────────────────────────────────────

function GuestListMockup() {
  const guests = [
    { name: 'Ada Okafor', side: 'Bride', cat: 'Family', date: 'Jun 3' },
    { name: 'Chike Eze', side: 'Groom', cat: 'Church', date: 'Jun 4' },
    { name: 'Ngozi Adah', side: 'Bride', cat: 'Work', date: 'Jun 5' },
    { name: 'Emeka Nwu.', side: 'Groom', cat: 'School', date: 'Jun 5' },
    { name: 'Kemi Babat.', side: 'Both', cat: 'Friends', date: 'Jun 6' },
    { name: 'Temi Adek.', side: 'Bride', cat: 'Church', date: 'Jun 6' },
  ]
  return (
    <div className="h-full bg-[#fdf8f4] overflow-hidden flex flex-col text-xs">
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center justify-between shrink-0">
        <span className="font-semibold text-stone-800 text-sm">Guest List</span>
        <div className="px-3 py-1 rounded-full bg-rose-50 text-rose-500 text-[10px] font-medium">Export CSV</div>
      </div>
      <div className="flex gap-2 p-3 shrink-0">
        {[['127','Total'],['68','Bride'],['59','Groom']].map(([n,l]) => (
          <div key={l} className="bg-white rounded-xl p-2.5 flex-1 text-center border border-stone-50 shadow-sm">
            <p className="font-bold text-stone-800 text-sm">{n}</p>
            <p className="text-stone-400 text-[9px] mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="px-3 mb-2 shrink-0">
        <div className="bg-white border border-stone-100 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-stone-300 text-xs">🔍</span>
          <span className="text-stone-300 text-[11px]">Search guests…</span>
        </div>
      </div>
      <div className="bg-white mx-3 rounded-xl overflow-hidden border border-stone-50 shadow-sm">
        <div className="grid grid-cols-4 px-3 py-2 text-[9px] text-stone-400 font-semibold uppercase tracking-wide border-b border-stone-50">
          <span>Name</span><span>Side</span><span>Cat.</span><span>RSVP</span>
        </div>
        {guests.map((g, i) => (
          <div key={i} className={`grid grid-cols-4 px-3 py-2.5 border-b border-stone-50 ${i%2===0?'':'bg-stone-50/50'}`}>
            <span className="text-stone-800 font-medium text-[10px] truncate">{g.name}</span>
            <span className={`text-[10px] font-medium ${g.side==='Bride'?'text-rose-500':g.side==='Groom'?'text-blue-500':'text-purple-500'}`}>{g.side}</span>
            <span className="text-stone-500 text-[10px]">{g.cat}</span>
            <span className="text-stone-400 text-[10px]">{g.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RegistryMockup() {
  const items = [
    { name: 'Samsung 500L Fridge', price: '₦699,000', claimed: 0, total: 1, emoji: '🧊' },
    { name: 'Dinner Table Set', price: '₦280,000', claimed: 1, total: 1, emoji: '🪑' },
    { name: 'LG 55" Smart TV', price: '₦450,000', claimed: 0, total: 2, emoji: '📺' },
  ]
  return (
    <div className="h-full bg-[#fdf8f4] overflow-hidden flex flex-col text-xs">
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center justify-between shrink-0">
        <span className="font-semibold text-stone-800 text-sm">Gift Registry</span>
        <div className="px-3 py-1 rounded-full bg-rose-500 text-white text-[10px] font-medium">+ Add item</div>
      </div>
      <div className="flex gap-2 p-3 shrink-0">
        {[['3','Items'],['1','Claimed'],['₦1.4M','Value']].map(([n,l]) => (
          <div key={l} className="bg-white rounded-xl p-2.5 flex-1 text-center border border-stone-50 shadow-sm">
            <p className="font-bold text-stone-800 text-sm">{n}</p>
            <p className="text-stone-400 text-[9px] mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="px-3 space-y-2">
        {items.map((item, i) => (
          <div key={i} className={`bg-white rounded-xl p-3 border shadow-sm flex items-center gap-3 ${item.claimed===item.total?'opacity-60 border-green-100':'border-stone-50'}`}>
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-lg shrink-0">{item.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-800 text-[11px] truncate">{item.name}</p>
              <p className="font-bold text-stone-800 text-[11px]">{item.price}</p>
              <p className="text-stone-400 text-[9px]">{item.total-item.claimed} of {item.total} remaining</p>
            </div>
            <div className={`text-[9px] px-2 py-1 rounded-full font-medium shrink-0 ${item.claimed===item.total?'bg-green-50 text-green-600':'bg-stone-50 text-stone-500'}`}>
              {item.claimed===item.total?'✓ Claimed':'Available'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SeatingMockup() {
  const tables = [
    { name: 'Head Table', cap: 8, filled: 6, guests: ['Bride','Groom','Best Man','Maid of Honour'] },
    { name: 'Family Table A', cap: 10, filled: 10, guests: ['Ada Okafor','Chief Okafor','Mrs Okafor','Ngozi A.'] },
    { name: 'Church Table', cap: 8, filled: 5, guests: ['Pastor Jide','Kemi Babs','Temi A.','Seun K.'] },
  ]
  return (
    <div className="h-full bg-[#fdf8f4] overflow-hidden flex flex-col text-xs">
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center justify-between shrink-0">
        <span className="font-semibold text-stone-800 text-sm">Seating</span>
        <div className="px-3 py-1 rounded-full bg-rose-500 text-white text-[10px] font-medium">+ New table</div>
      </div>
      <div className="flex gap-2 px-3 pt-3 pb-2 shrink-0">
        {[['3','Tables'],['21','Seated'],['26','Unassigned']].map(([n,l]) => (
          <div key={l} className="bg-white rounded-xl p-2.5 flex-1 text-center border border-stone-50 shadow-sm">
            <p className="font-bold text-stone-800 text-sm">{n}</p>
            <p className="text-stone-400 text-[9px] mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="px-3 space-y-2">
        {tables.map((t, i) => (
          <div key={i} className={`bg-white rounded-xl p-3 border shadow-sm ${t.filled===t.cap?'border-green-100':'border-stone-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-stone-800 text-[11px]">{t.name}</p>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${t.filled===t.cap?'bg-green-50 text-green-600':'bg-amber-50 text-amber-600'}`}>{t.filled}/{t.cap}</span>
            </div>
            <div className="h-1 bg-stone-100 rounded-full mb-2">
              <div className="h-1 rounded-full bg-rose-400" style={{ width:`${(t.filled/t.cap)*100}%` }} />
            </div>
            <div className="flex flex-wrap gap-1">
              {t.guests.slice(0,3).map((g,j) => (
                <span key={j} className="text-[9px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">{g}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LaptopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      <div className="bg-stone-800 rounded-xl p-2 shadow-xl shadow-stone-900/20">
        <div className="flex items-center gap-1.5 mb-1.5 px-1">
          <span className="w-2 h-2 rounded-full bg-red-400/70" />
          <span className="w-2 h-2 rounded-full bg-amber-400/70" />
          <span className="w-2 h-2 rounded-full bg-green-400/70" />
          <div className="flex-1 mx-2 h-3.5 bg-stone-700 rounded-md flex items-center px-2">
            <span className="text-[7px] text-stone-500 truncate">wedding-platform-five.vercel.app/admin</span>
          </div>
        </div>
        <div className="rounded-lg overflow-hidden border border-stone-700/50" style={{ aspectRatio: '16/10' }}>
          {children}
        </div>
      </div>
      <div className="mx-auto h-2 bg-stone-700 rounded-b-lg" style={{ width: '78%' }} />
      <div className="mx-auto h-1.5 bg-stone-600 rounded-b-md" style={{ width: '88%' }} />
    </div>
  )
}

// ── Slide data ─────────────────────────────────────────────────────────────

const slides = [
  { caption: 'Your guest list, organized', sub: 'Every RSVP searchable in real time', mockup: <GuestListMockup /> },
  { caption: 'Your gift registry, one page', sub: 'Track claims and cash gifts automatically', mockup: <RegistryMockup /> },
  { caption: 'Seating made simple', sub: 'Assign tables whenever you\'re ready', mockup: <SeatingMockup /> },
]

const PEEK = 12
const STEP = 0.85

// ── Stacked cards scroll section ────────────────────────────────────────────

export default function ScreenshotSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return
      const scrolled = Math.max(0, -ref.current.getBoundingClientRect().top)
      setActive(Math.min(slides.length - 1, Math.floor(scrolled / (window.innerHeight * STEP))))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function goTo(i: number) {
    if (!ref.current) return
    const top = ref.current.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: top + i * window.innerHeight * STEP, behavior: 'smooth' })
  }

  return (
    <div ref={ref} style={{ height: `${slides.length * STEP * 100}vh`, background: '#FDF8F4' }}>
      <div style={{
        position: 'sticky', top: 0, height: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 20px',
      }}>
        {/* Header */}
        <div style={{ position: 'absolute', top: 28, left: 0, right: 0, textAlign: 'center' }}>
          <p style={{ fontSize: 10, color: '#A8A29E', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'Arial, sans-serif', margin: '0 0 10px 0' }}>
            See it in action
          </p>
          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 7 }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                style={{
                  width: i === active ? 22 : 7, height: 7, borderRadius: 4,
                  border: 'none', cursor: 'pointer', padding: 0,
                  background: i <= active ? '#D4547A' : '#E7E5E4',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Stacked laptop cards */}
        <div style={{
          position: 'relative',
          width: '100%', maxWidth: 580,
          height: `calc(68vh + ${(slides.length - 1) * PEEK}px)`,
        }}>
          {slides.map((slide, i) => {
            const isPast = i < active
            const depth = Math.max(0, i - active)

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: '68vh',
                  background: '#FFF9F5',
                  borderRadius: 20,
                  border: '1px solid #EDE8E4',
                  boxShadow: `0 ${4 + depth * 4}px ${16 + depth * 12}px rgba(0,0,0,${0.07 + depth * 0.02})`,
                  zIndex: slides.length - i,
                  transform: isPast
                    ? 'translateY(-110%)'
                    : `translateY(${depth * PEEK}px) scale(${1 - depth * 0.025})`,
                  transformOrigin: 'top center',
                  transition: isPast
                    ? 'transform 0.85s cubic-bezier(0.76, 0, 0.24, 1)'
                    : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  padding: '20px 20px 16px',
                  gap: 14,
                }}
              >
                {/* Caption */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <p style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(16px, 2.5vw, 22px)', color: '#1C1917', fontWeight: 700, margin: '0 0 3px 0' }}>
                    {slide.caption}
                  </p>
                  <p style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#A8A29E', margin: 0 }}>
                    {slide.sub}
                  </p>
                </div>
                {/* Laptop mockup */}
                <div style={{ flex: 1, minHeight: 0 }}>
                  <LaptopFrame>{slide.mockup}</LaptopFrame>
                </div>
              </div>
            )
          })}
        </div>

        {/* Next / continue hint */}
        {active < slides.length - 1 ? (
          <button
            onClick={() => goTo(active + 1)}
            style={{
              position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#A8A29E', fontFamily: 'Arial, sans-serif',
              fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase',
            }}
          >
            next
            <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
              <path d="M6 0v11M1 6.5l5 6 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : (
          <p style={{ position: 'absolute', bottom: 24, fontFamily: 'Arial, sans-serif', fontSize: 11, color: '#A8A29E', letterSpacing: '0.1em' }}>
            Scroll to continue ↓
          </p>
        )}
      </div>
    </div>
  )
}
