'use client'

import { QrCode, Gift, Users, LayoutGrid } from 'lucide-react'
import Image from 'next/image'

// Inline phone mockup of the RSVP form
function RsvpPhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 240, filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.18))' }}>
      {/* Phone frame */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: 40,
        padding: '12px 8px',
        position: 'relative',
      }}>
        {/* Notch */}
        <div style={{
          width: 80, height: 20, background: '#1a1a1a',
          borderRadius: '0 0 14px 14px',
          margin: '0 auto 0',
          position: 'relative', zIndex: 10,
        }} />
        {/* Screen */}
        <div style={{
          background: '#fdf8f4',
          borderRadius: 28,
          overflow: 'hidden',
          height: 460,
        }}>
          {/* Cover image strip */}
          <div style={{
            height: 90,
            background: 'linear-gradient(135deg, #D4547A, #E8A0B0)',
            display: 'flex', alignItems: 'flex-end', padding: '0 14px 10px',
          }}>
            <div>
              <p style={{ color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'serif' }}>Ada & Chike</p>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9 }}>July 12, 2025 · Eko Hotel, Lagos</p>
            </div>
          </div>

          {/* Form area */}
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#1C1917' }}>Confirm Your Attendance</p>

            {/* Name field */}
            <div>
              <div style={{ fontSize: 8, color: '#A8A29E', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Full Name</div>
              <div style={{ background: 'white', border: '1px solid #E7E5E4', borderRadius: 8, padding: '5px 8px', fontSize: 10, color: '#78716C' }}>
                Your full name
              </div>
            </div>

            {/* Phone field */}
            <div>
              <div style={{ fontSize: 8, color: '#A8A29E', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Phone Number</div>
              <div style={{ background: 'white', border: '1px solid #E7E5E4', borderRadius: 8, padding: '5px 8px', fontSize: 10, color: '#78716C', display: 'flex', gap: 5, alignItems: 'center' }}>
                <span style={{ color: '#D4547A', fontWeight: 600 }}>🇳🇬</span> +234
              </div>
            </div>

            {/* Side selector */}
            <div>
              <div style={{ fontSize: 8, color: '#A8A29E', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Who do you know?</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['Bride', 'Groom', 'Both'].map((s, i) => (
                  <div key={s} style={{
                    flex: 1, textAlign: 'center', padding: '4px 0', borderRadius: 6, fontSize: 9,
                    background: i === 0 ? '#FFF1F4' : 'white',
                    border: `1px solid ${i === 0 ? '#D4547A' : '#E7E5E4'}`,
                    color: i === 0 ? '#D4547A' : '#78716C',
                    fontWeight: i === 0 ? 600 : 400,
                  }}>{s}</div>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <div style={{ fontSize: 8, color: '#A8A29E', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</div>
              <div style={{ background: 'white', border: '1px solid #E7E5E4', borderRadius: 8, padding: '5px 8px', fontSize: 10, color: '#A8A29E', display: 'flex', justifyContent: 'space-between' }}>
                <span>How do you know them?</span>
                <span>›</span>
              </div>
            </div>

            {/* Submit */}
            <div style={{
              background: '#D4547A',
              borderRadius: 10, padding: '8px',
              textAlign: 'center', color: 'white',
              fontSize: 10, fontWeight: 700,
              marginTop: 4,
            }}>
              Confirm Attendance
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const features = [
  {
    Icon: QrCode,
    title: 'Digital RSVP',
    desc: 'Share one QR code or link. Guests confirm attendance in 30 seconds — no app, no login.',
    visual: <RsvpPhoneMockup />,
    reverse: false,
  },
  {
    Icon: Gift,
    title: 'Gift Registry',
    desc: 'List physical gifts with checkout links, or let guests send cash equivalents directly. All in one page.',
    img: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=700&q=80',
    imgAlt: 'Wedding gifts',
    reverse: true,
  },
  {
    Icon: Users,
    title: 'Guest Management',
    desc: 'Every RSVP lands in your dashboard. Filter by side or category, search by name, export to CSV.',
    img: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=700&q=80',
    imgAlt: 'Wedding guests',
    reverse: false,
  },
  {
    Icon: LayoutGrid,
    title: 'Seating',
    desc: 'Assign guests to tables whenever you\'re ready. See capacity at a glance, update anytime.',
    img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=700&q=80',
    imgAlt: 'Elegant table setting',
    reverse: true,
  },
]

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-5">
        <p className="text-center text-xs text-stone-400 uppercase tracking-widest font-medium mb-3">What you get</p>
        <h2 className="font-serif text-2xl sm:text-3xl text-stone-800 text-center mb-20">
          Everything in one place.
        </h2>

        <div className="space-y-24">
          {features.map((f) => (
            <div
              key={f.title}
              className={`flex flex-col ${f.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-10 md:gap-16`}
            >
              {/* Visual */}
              <div className="w-full md:w-1/2 flex items-center justify-center">
                {f.img ? (
                  <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl shadow-stone-200/60" style={{ aspectRatio: '4/3' }}>
                    <Image
                      src={f.img}
                      alt={f.imgAlt!}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent" />
                  </div>
                ) : (
                  f.visual
                )}
              </div>

              {/* Text */}
              <div className="w-full md:w-1/2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 mb-5">
                  <f.Icon className="w-5 h-5 text-rose-500" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl text-stone-800 mb-4">{f.title}</h3>
                <p className="text-stone-500 text-base leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
