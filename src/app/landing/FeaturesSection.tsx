'use client'

import { QrCode, Gift, Users, LayoutGrid } from 'lucide-react'
import Image from 'next/image'
import { useRef } from 'react'

// ── RSVP Phone Mockup ──────────────────────────────────────────────────────

function RsvpPhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 220, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.18))' }}>
      <div style={{ background: '#1a1a1a', borderRadius: 36, padding: '10px 6px' }}>
        <div style={{ width: 72, height: 18, background: '#1a1a1a', borderRadius: '0 0 12px 12px', margin: '0 auto', position: 'relative', zIndex: 10 }} />
        <div style={{ background: '#fdf8f4', borderRadius: 26, overflow: 'hidden', height: 420 }}>
          <div style={{ height: 82, background: 'linear-gradient(135deg,#D4547A,#E8A0B0)', display: 'flex', alignItems: 'flex-end', padding: '0 12px 10px' }}>
            <div>
              <p style={{ color: 'white', fontSize: 12, fontWeight: 700, fontFamily: 'serif' }}>Ada & Chike</p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 8 }}>July 12, 2025 · Eko Hotel, Lagos</p>
            </div>
          </div>
          <div style={{ padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 9 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#1C1917' }}>Confirm Your Attendance</p>
            {[['Full Name','Your full name'],['Phone Number','+234']].map(([l,p]) => (
              <div key={l}>
                <div style={{ fontSize: 7, color: '#A8A29E', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</div>
                <div style={{ background: 'white', border: '1px solid #E7E5E4', borderRadius: 7, padding: '4px 7px', fontSize: 9, color: '#78716C' }}>{p}</div>
              </div>
            ))}
            <div>
              <div style={{ fontSize: 7, color: '#A8A29E', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Who do you know?</div>
              <div style={{ display: 'flex', gap: 3 }}>
                {['Bride','Groom','Both'].map((s,i) => (
                  <div key={s} style={{ flex:1, textAlign:'center', padding:'3px 0', borderRadius:5, fontSize:8, background: i===0?'#FFF1F4':'white', border:`1px solid ${i===0?'#D4547A':'#E7E5E4'}`, color: i===0?'#D4547A':'#78716C', fontWeight: i===0?600:400 }}>{s}</div>
                ))}
              </div>
            </div>
            <div style={{ background:'#D4547A', borderRadius:9, padding:'7px', textAlign:'center', color:'white', fontSize:9, fontWeight:700, marginTop:2 }}>
              Confirm Attendance
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Feature data ───────────────────────────────────────────────────────────

const features = [
  {
    Icon: QrCode,
    title: 'Digital RSVP',
    desc: 'Share one QR code or link. Guests confirm in 30 seconds — no app, no login.',
    visual: <RsvpPhoneMockup />,
  },
  {
    Icon: Gift,
    title: 'Gift Registry',
    desc: 'Physical gifts or cash equivalents — guests choose. All tracked in one place.',
    img: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=700&q=80',
    imgAlt: 'Wedding gifts',
  },
  {
    Icon: Users,
    title: 'Guest Management',
    desc: 'Every RSVP lands in your dashboard. Filter, search, export to CSV.',
    img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=700&q=80',
    imgAlt: 'Group of guests',
  },
  {
    Icon: LayoutGrid,
    title: 'Seating',
    desc: 'Assign guests to tables whenever you\'re ready. See capacity at a glance.',
    img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=700&q=80',
    imgAlt: 'Table setting',
  },
]

// ── Component ──────────────────────────────────────────────────────────────

export default function FeaturesSection() {
  const trackRef = useRef<HTMLDivElement>(null)

  return (
    <section className="pt-12 pb-10 sm:pt-20 sm:pb-16 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto px-5 mb-6 sm:mb-10">
        <p className="text-center text-xs text-stone-400 uppercase tracking-widest font-medium mb-2">What you get</p>
        <h2 className="font-serif text-2xl sm:text-3xl text-stone-800 text-center">Everything in one place.</h2>
      </div>

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
          paddingLeft: 'max(20px, calc(50vw - 580px))',
          paddingRight: 'max(20px, calc(50vw - 580px))',
          gap: 20,
        }}
      >
        {features.map((f) => (
          <div
            key={f.title}
            style={{
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
              flex: '0 0 min(340px, 88vw)',
            }}
            className="bg-[#fdf8f4] rounded-3xl border border-stone-100 overflow-hidden flex flex-col"
          >
            {/* Visual area */}
            <div className="relative flex items-center justify-center bg-rose-50/40 overflow-hidden" style={{ height: 200 }}>
              {f.img ? (
                <Image
                  src={f.img}
                  alt={f.imgAlt!}
                  fill
                  className="object-cover"
                  sizes="340px"
                  loading="lazy"
                />
              ) : (
                <div className="py-6">{f.visual}</div>
              )}
            </div>

            {/* Text area */}
            <div className="p-6 flex flex-col gap-3 flex-1">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-rose-100 shadow-sm">
                <f.Icon className="w-4 h-4 text-rose-500" strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-xl text-stone-800">{f.title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      <DotIndicator trackRef={trackRef} count={features.length} />
    </section>
  )
}

// ── Dot nav ────────────────────────────────────────────────────────────────

function DotIndicator({ trackRef, count }: { trackRef: React.RefObject<HTMLDivElement>, count: number }) {
  const dotsRef = useRef<(HTMLButtonElement | null)[]>([])

  // Sync active dot to scroll position
  if (typeof window !== 'undefined') {
    // handled via useEffect in a proper client component — safe here since whole file is 'use client'
  }

  function scrollTo(i: number) {
    const el = trackRef.current
    if (!el) return
    const slideWidth = el.scrollWidth / count
    el.scrollTo({ left: slideWidth * i, behavior: 'smooth' })
  }

  return (
    <div className="flex justify-center gap-2 mt-6">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          ref={el => { dotsRef.current[i] = el }}
          onClick={() => scrollTo(i)}
          className="w-2 h-2 rounded-full bg-rose-200 hover:bg-rose-400 transition-colors focus:outline-none"
          aria-label={`Go to slide ${i + 1}`}
        />
      ))}
    </div>
  )
}
