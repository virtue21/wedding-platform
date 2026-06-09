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
      {/* Top bar */}
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center justify-between shrink-0">
        <span className="font-semibold text-stone-800 text-sm">Guest List</span>
        <div className="flex gap-2">
          <div className="px-3 py-1 rounded-full bg-rose-50 text-rose-500 text-[10px] font-medium">Export CSV</div>
          <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">⋯</div>
        </div>
      </div>
      {/* Stats */}
      <div className="flex gap-2 p-3 shrink-0">
        {[['127', 'Total guests'], ['68', 'Bride\'s side'], ['59', 'Groom\'s side']].map(([n, l]) => (
          <div key={l} className="bg-white rounded-xl p-2.5 flex-1 text-center border border-stone-50 shadow-sm">
            <p className="font-bold text-stone-800 text-sm">{n}</p>
            <p className="text-stone-400 text-[9px] mt-0.5 leading-tight">{l}</p>
          </div>
        ))}
      </div>
      {/* Search */}
      <div className="px-3 mb-2 shrink-0">
        <div className="bg-white border border-stone-100 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-stone-300 text-xs">🔍</span>
          <span className="text-stone-300 text-[11px]">Search guests…</span>
        </div>
      </div>
      {/* Table */}
      <div className="bg-white mx-3 rounded-xl overflow-hidden border border-stone-50 shadow-sm flex-1">
        <div className="grid grid-cols-4 px-3 py-2 text-[9px] text-stone-400 font-semibold uppercase tracking-wide border-b border-stone-50">
          <span>Name</span><span>Side</span><span>Category</span><span>RSVP</span>
        </div>
        {guests.map((g, i) => (
          <div key={i} className={`grid grid-cols-4 px-3 py-2.5 border-b border-stone-50 ${i % 2 === 0 ? '' : 'bg-stone-50/50'}`}>
            <span className="text-stone-800 font-medium text-[10px] truncate">{g.name}</span>
            <span className={`text-[10px] font-medium ${g.side === 'Bride' ? 'text-rose-500' : g.side === 'Groom' ? 'text-blue-500' : 'text-purple-500'}`}>{g.side}</span>
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
      {/* Summary */}
      <div className="flex gap-2 p-3 shrink-0">
        {[['3', 'Items'], ['1', 'Claimed'], ['₦1.4M', 'Total value']].map(([n, l]) => (
          <div key={l} className="bg-white rounded-xl p-2.5 flex-1 text-center border border-stone-50 shadow-sm">
            <p className="font-bold text-stone-800 text-sm">{n}</p>
            <p className="text-stone-400 text-[9px] mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      {/* Items */}
      <div className="px-3 space-y-2">
        {items.map((item, i) => (
          <div key={i} className={`bg-white rounded-xl p-3 border shadow-sm flex items-center gap-3 ${item.claimed === item.total ? 'opacity-60 border-green-100' : 'border-stone-50'}`}>
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-lg shrink-0">{item.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-800 text-[11px] truncate">{item.name}</p>
              <p className="font-bold text-stone-800 text-[11px]">{item.price}</p>
              <p className="text-stone-400 text-[9px]">{item.total - item.claimed} of {item.total} remaining</p>
            </div>
            <div className={`text-[9px] px-2 py-1 rounded-full font-medium shrink-0 ${item.claimed === item.total ? 'bg-green-50 text-green-600' : 'bg-stone-50 text-stone-500'}`}>
              {item.claimed === item.total ? '✓ Claimed' : 'Available'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SeatingMockup() {
  const tables = [
    { name: 'Head Table', cap: 8, filled: 6, guests: ['Bride', 'Groom', 'Best Man', 'Maid of Honour', 'Mr & Mrs Eze', '...'] },
    { name: 'Family Table A', cap: 10, filled: 10, guests: ['Ada Okafor', 'Chief Okafor', 'Mrs Okafor', 'Ngozi A.', 'Emeka N.', '+ 5 more'] },
    { name: 'Church Table', cap: 8, filled: 5, guests: ['Pastor Jide', 'Kemi Babs', 'Temi A.', 'Seun K.', 'Lola M.'] },
  ]
  return (
    <div className="h-full bg-[#fdf8f4] overflow-hidden flex flex-col text-xs">
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center justify-between shrink-0">
        <span className="font-semibold text-stone-800 text-sm">Seating</span>
        <div className="px-3 py-1 rounded-full bg-rose-500 text-white text-[10px] font-medium">+ New table</div>
      </div>
      <div className="flex gap-2 px-3 pt-3 pb-2 shrink-0">
        {[['3', 'Tables'], ['21', 'Seated'], ['26', 'Unassigned']].map(([n, l]) => (
          <div key={l} className="bg-white rounded-xl p-2.5 flex-1 text-center border border-stone-50 shadow-sm">
            <p className="font-bold text-stone-800 text-sm">{n}</p>
            <p className="text-stone-400 text-[9px] mt-0.5">{l}</p>
          </div>
        ))}
      </div>
      <div className="px-3 space-y-2">
        {tables.map((t, i) => (
          <div key={i} className={`bg-white rounded-xl p-3 border shadow-sm ${t.filled === t.cap ? 'border-green-100' : 'border-stone-50'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-stone-800 text-[11px]">{t.name}</p>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${t.filled === t.cap ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                {t.filled}/{t.cap}
              </span>
            </div>
            {/* Capacity bar */}
            <div className="h-1 bg-stone-100 rounded-full mb-2">
              <div className="h-1 rounded-full bg-rose-400" style={{ width: `${(t.filled / t.cap) * 100}%` }} />
            </div>
            <div className="flex flex-wrap gap-1">
              {t.guests.slice(0, 4).map((g, j) => (
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
    <div className="relative mx-auto w-full" style={{ maxWidth: 680 }}>
      <div className="bg-stone-800 rounded-2xl p-3 shadow-2xl shadow-stone-900/30">
        {/* Title bar */}
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
          <div className="flex-1 mx-2 h-4 bg-stone-700 rounded-md flex items-center px-2">
            <span className="text-[8px] text-stone-500 truncate">wedding-platform-five.vercel.app/admin</span>
          </div>
        </div>
        {/* Screen */}
        <div className="rounded-xl overflow-hidden border border-stone-700/50" style={{ aspectRatio: '16/10' }}>
          {children}
        </div>
      </div>
      <div className="mx-auto h-3 bg-stone-700 rounded-b-xl" style={{ width: '80%' }} />
      <div className="mx-auto h-1.5 bg-stone-600 rounded-b-lg" style={{ width: '90%' }} />
    </div>
  )
}

// ── Sticky Scroll Section ───────────────────────────────────────────────────

const screens = [
  {
    caption: 'Your guest list, organized',
    sub: 'Every RSVP, searchable and filterable in real time',
    content: <GuestListMockup />,
  },
  {
    caption: 'Your gift registry, one page',
    sub: 'Track claims, cash gifts, and receipts automatically',
    content: <RegistryMockup />,
  },
  {
    caption: 'Seating made simple',
    sub: 'Assign tables whenever you\'re ready, update anytime',
    content: <SeatingMockup />,
  },
]

export default function ScreenshotSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [revealed, setRevealed] = useState<Set<number>>(new Set([0]))

  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return
      const scrolled = Math.max(0, -sectionRef.current.getBoundingClientRect().top)
      const wh = window.innerHeight
      const next = Math.min(screens.length - 1, Math.floor(scrolled / wh))
      setActive(next)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setRevealed(r => { const n = new Set(r); n.add(active); return n }), 300)
    return () => clearTimeout(t)
  }, [active])

  return (
    <div ref={sectionRef} style={{ height: `${screens.length * 100}vh` }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: '#fdf8f4' }}>
        {screens.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: screens.length - i,
              transform: i < active ? 'translateY(-100%)' : 'translateY(0)',
              transition: 'transform 0.75s cubic-bezier(0.77, 0, 0.175, 1)',
              background: '#fdf8f4',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px 20px',
            }}
          >
            <div style={{ width: '100%', maxWidth: 700 }}>
              {/* Caption above */}
              <div style={{
                textAlign: 'center', marginBottom: 24,
                opacity: revealed.has(i) ? 1 : 0,
                transform: revealed.has(i) ? 'translateY(0)' : 'translateY(-12px)',
                transition: 'opacity 0.5s ease, transform 0.5s ease',
              }}>
                <p style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: 'clamp(18px, 2.5vw, 26px)',
                  color: '#1C1917',
                  fontWeight: 600,
                  marginBottom: 6,
                }}>{s.caption}</p>
                <p style={{ fontSize: 13, color: '#A8A29E' }}>{s.sub}</p>
              </div>

              {/* Laptop frame */}
              <div style={{
                opacity: revealed.has(i) ? 1 : 0,
                transform: revealed.has(i) ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
                transition: 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s',
              }}>
                <LaptopFrame>{s.content}</LaptopFrame>
              </div>

              {/* Dot nav */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                {screens.map((_, j) => (
                  <div key={j} style={{
                    height: 6,
                    width: j === i ? 24 : 6,
                    borderRadius: 3,
                    background: j === i ? '#D4547A' : '#E7B8C5',
                    transition: 'all 0.3s',
                  }} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
