'use client'

import { useRef, useState, useEffect } from 'react'

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

// ── Laptop Frame ────────────────────────────────────────────────────────────

function LaptopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      <div className="bg-stone-800 rounded-2xl p-2.5 shadow-2xl shadow-stone-900/30">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <span className="w-2 h-2 rounded-full bg-red-400/70" />
          <span className="w-2 h-2 rounded-full bg-amber-400/70" />
          <span className="w-2 h-2 rounded-full bg-green-400/70" />
          <div className="flex-1 mx-2 h-3.5 bg-stone-700 rounded-md flex items-center px-2">
            <span className="text-[7px] text-stone-500 truncate">wedding-platform-five.vercel.app/admin</span>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border border-stone-700/50" style={{ aspectRatio: '16/10' }}>
          {children}
        </div>
      </div>
      <div className="mx-auto h-2.5 bg-stone-700 rounded-b-xl" style={{ width: '80%' }} />
      <div className="mx-auto h-1.5 bg-stone-600 rounded-b-lg" style={{ width: '90%' }} />
    </div>
  )
}

// ── Slides data ─────────────────────────────────────────────────────────────

const slides = [
  { caption: 'Your guest list, organized', sub: 'Every RSVP, searchable in real time', content: <GuestListMockup /> },
  { caption: 'Your gift registry, one page', sub: 'Track claims and cash gifts automatically', content: <RegistryMockup /> },
  { caption: 'Seating made simple', sub: 'Assign tables whenever you\'re ready', content: <SeatingMockup /> },
]

// ── Main component ──────────────────────────────────────────────────────────

export default function ScreenshotSection() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  // Track active slide from scroll position
  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const onScroll = () => {
      const slideW = el.scrollWidth / slides.length
      const i = Math.round(el.scrollLeft / slideW)
      setActive(Math.min(slides.length - 1, Math.max(0, i)))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTo(i: number) {
    const el = trackRef.current
    if (!el) return
    const slideW = el.offsetWidth
    el.scrollTo({ left: slideW * i, behavior: 'smooth' })
  }

  return (
    <div>
      {/* Scroll track */}
      <div
        ref={trackRef}
        className="flex overflow-x-auto"
        style={{
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch' as never,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {slides.map((s, i) => (
          <div
            key={i}
            className="flex-none w-full px-4 sm:px-8"
            style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
          >
            <div className="max-w-3xl mx-auto">
              {/* Caption */}
              <div className="text-center mb-4">
                <p className="font-serif text-lg sm:text-2xl text-stone-800 font-semibold mb-1">{s.caption}</p>
                <p className="text-sm text-stone-400">{s.sub}</p>
              </div>
              {/* Laptop */}
              <LaptopFrame>{s.content}</LaptopFrame>
            </div>
          </div>
        ))}
      </div>

      {/* Dot nav */}
      <div className="flex justify-center gap-2 mt-5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className="focus:outline-none transition-all duration-300"
            aria-label={`Slide ${i + 1}`}
            style={{
              height: 6,
              width: i === active ? 24 : 6,
              borderRadius: 3,
              background: i === active ? '#D4547A' : '#E7B8C5',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  )
}
