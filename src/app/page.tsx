import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, MessageSquare, Send, Gift, ArrowRight, LayoutGrid } from 'lucide-react'

// ── Phone mockup — RSVP form ───────────────────────────────────────────────

function PhoneMockup() {
  return (
    <div
      style={{
        width: 258,
        filter: 'drop-shadow(0 28px 56px rgba(0,0,0,0.18))',
        flexShrink: 0,
      }}
    >
      {/* Body */}
      <div
        style={{
          background: '#111827',
          borderRadius: 44,
          padding: '14px 9px',
          position: 'relative',
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 88,
            height: 22,
            background: '#111827',
            borderRadius: '0 0 16px 16px',
            zIndex: 10,
          }}
        />
        {/* Screen */}
        <div
          style={{
            background: '#fdf8f4',
            borderRadius: 32,
            overflow: 'hidden',
          }}
        >
          {/* Pink header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #C94070, #E07090)',
              padding: '30px 16px 14px',
            }}
          >
            <p
              style={{
                color: 'white',
                fontSize: 14,
                fontWeight: 700,
                fontFamily: 'Georgia, serif',
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Ada &amp; Chike
            </p>
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 10, margin: '3px 0 0' }}>
              July 12, 2025 &middot; Eko Hotel, Lagos
            </p>
          </div>

          {/* Form body */}
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 11 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#1C1917', margin: 0 }}>
              Confirm Your Attendance
            </p>

            {/* Full Name */}
            <div>
              <p style={{ fontSize: 7, color: '#A8A29E', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                Full Name
              </p>
              <div style={{ background: 'white', border: '1px solid #E7E5E4', borderRadius: 8, padding: '6px 9px', fontSize: 10, color: '#C4B8B0' }}>
                Your full name
              </div>
            </div>

            {/* Phone */}
            <div>
              <p style={{ fontSize: 7, color: '#A8A29E', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                Phone Number
              </p>
              <div style={{ background: 'white', border: '1px solid #E7E5E4', borderRadius: 8, padding: '6px 9px', fontSize: 10, color: '#C4B8B0' }}>
                +234
              </div>
            </div>

            {/* Who do you know */}
            <div>
              <p style={{ fontSize: 7, color: '#A8A29E', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                Who do you know?
              </p>
              <div style={{ display: 'flex', gap: 5 }}>
                {[
                  { label: 'Bride', active: true },
                  { label: 'Groom', active: false },
                  { label: 'Both', active: false },
                ].map(({ label, active }) => (
                  <div
                    key={label}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '4px 0',
                      borderRadius: 7,
                      fontSize: 9,
                      fontWeight: active ? 600 : 400,
                      background: active ? '#FFF0F3' : 'white',
                      border: `1px solid ${active ? '#C94070' : '#E7E5E4'}`,
                      color: active ? '#C94070' : '#78716C',
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* How do you know them */}
            <div>
              <p style={{ fontSize: 7, color: '#A8A29E', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                How do you know them?
              </p>
              <div style={{ background: 'white', border: '1px solid #E7E5E4', borderRadius: 8, padding: '6px 9px', fontSize: 10, color: '#C4B8B0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Select category</span>
                <span style={{ fontSize: 8, color: '#D1CBC6' }}>▾</span>
              </div>
            </div>

            {/* Confirm button */}
            <div
              style={{
                background: '#C94070',
                borderRadius: 10,
                padding: '10px',
                textAlign: 'center',
                color: 'white',
                fontSize: 10,
                fontWeight: 700,
                marginTop: 2,
                letterSpacing: '0.01em',
              }}
            >
              Confirm Attendance
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Admin laptop mockup — guest list ───────────────────────────────────────

function AdminMockup() {
  const guests = [
    { name: 'Ada Okafor',      side: 'Bride', cat: 'Family',  date: 'Jun 3' },
    { name: 'Chike Eze',       side: 'Groom', cat: 'Church',  date: 'Jun 4' },
    { name: 'Ngozi Adah',      side: 'Bride', cat: 'Work',    date: 'Jun 5' },
    { name: 'Emeka Nwosu',     side: 'Groom', cat: 'School',  date: 'Jun 5' },
    { name: 'Kemi Babatunde',  side: 'Both',  cat: 'Friends', date: 'Jun 6' },
    { name: 'Temi Adekunle',   side: 'Bride', cat: 'Church',  date: 'Jun 7' },
  ]

  const sideColor: Record<string, string> = {
    Bride: '#C94070',
    Groom: '#2563EB',
    Both:  '#7C3AED',
  }

  return (
    <div className="w-full max-w-3xl mx-auto" style={{ filter: 'drop-shadow(0 20px 48px rgba(0,0,0,0.14))' }}>
      {/* Lid */}
      <div style={{ background: '#2A2A2A', borderRadius: '14px 14px 0 0', padding: '10px 10px 0' }}>
        {/* Browser chrome */}
        <div
          style={{
            background: '#1C1C1C',
            borderRadius: '8px 8px 0 0',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF5F57', display: 'inline-block' }} />
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FEBC2E', display: 'inline-block' }} />
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28C840', display: 'inline-block' }} />
          <div
            style={{
              flex: 1,
              marginLeft: 6,
              height: 20,
              background: '#2E2E2E',
              borderRadius: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 9, color: '#5A5A5A' }}>nemiplanner.com/admin/guests</span>
          </div>
        </div>

        {/* Screen content */}
        <div style={{ background: '#FAFAF9', minHeight: 300, padding: 16 }}>

          {/* Page title + export */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1C1917' }}>Guest List</span>
            <span style={{ fontSize: 9, background: '#FFF0F3', color: '#C94070', border: '1px solid #F9C0CC', borderRadius: 99, padding: '3px 10px', fontWeight: 600 }}>
              Export CSV
            </span>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[
              ['127', 'Total Guests'],
              ['68',  "Bride's Side"],
              ['59',  "Groom's Side"],
            ].map(([n, l]) => (
              <div
                key={l}
                style={{
                  flex: 1,
                  background: 'white',
                  borderRadius: 10,
                  padding: '10px 12px',
                  border: '1px solid #EEEBE7',
                }}
              >
                <p style={{ fontSize: 16, fontWeight: 700, color: '#1C1917', margin: 0 }}>{n}</p>
                <p style={{ fontSize: 9, color: '#A8A29E', margin: '2px 0 0' }}>{l}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div
            style={{
              background: 'white',
              border: '1px solid #E7E5E4',
              borderRadius: 8,
              padding: '7px 11px',
              marginBottom: 10,
              fontSize: 10,
              color: '#C4B8B0',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C4B8B0" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Search guests by name or phone…
          </div>

          {/* Table */}
          <div style={{ background: 'white', borderRadius: 10, overflow: 'hidden', border: '1px solid #EEEBE7' }}>
            {/* Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 0.8fr 1fr 0.8fr',
                padding: '8px 14px',
                borderBottom: '1px solid #F0EDE9',
                background: '#F5F3F0',
              }}
            >
              {['Name', 'Side', 'Category', 'RSVP'].map(h => (
                <span
                  key={h}
                  style={{ fontSize: 8, color: '#A8A29E', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}
                >
                  {h}
                </span>
              ))}
            </div>
            {/* Rows */}
            {guests.map((g, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 0.8fr 1fr 0.8fr',
                  padding: '9px 14px',
                  borderBottom: i < guests.length - 1 ? '1px solid #F5F3F0' : 'none',
                  background: i % 2 === 0 ? 'white' : '#FAFAF9',
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 500, color: '#1C1917' }}>{g.name}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: sideColor[g.side] }}>{g.side}</span>
                <span style={{ fontSize: 10, color: '#78716C' }}>{g.cat}</span>
                <span style={{ fontSize: 10, color: '#A8A29E' }}>{g.date}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Base */}
      <div style={{ background: '#2A2A2A', height: 7, borderRadius: '0 0 4px 4px' }} />
      <div
        style={{
          background: '#CBCBCB',
          height: 14,
          borderRadius: '0 0 10px 10px',
          margin: '0 -18px',
          boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
        }}
      />
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function RootPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/admin/guests')

  const problems = [
    { Icon: Users,          text: "You need a number for the caterer and all you have is maybes" },
    { Icon: MessageSquare,  text: "Your guest list is in three WhatsApp chats and your mum's head" },
    { Icon: Send,           text: "You've been forwarding your account number all week" },
    { Icon: Gift,           text: "The wedding is over and you can't match gifts to names" },
  ]

  const steps = [
    { n: '1', title: 'Sign up and set up your wedding', sub: 'Add your names, date, and venue in minutes.' },
    { n: '2', title: 'Share your QR code or link',      sub: 'One link for RSVPs, registry, and everything else.' },
    { n: '3', title: 'Manage from your dashboard',      sub: 'Track guests, gifts, and seating in real time.' },
  ]

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── NAV ── */}
      <nav className="border-b border-stone-100 bg-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="font-serif text-[1.1rem] text-stone-900 tracking-tight">NemiPlanner</span>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── SECTION 1: HERO ── */}
      <section className="relative pt-8 pb-14 sm:pt-12 sm:pb-20 overflow-hidden">
        {/* Wedding backdrop */}
        <Image
          src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=85"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        {/* Left-to-right gradient: opaque white on left (text), fades to show photo on right */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 sm:via-white/80 to-white/40 sm:to-white/10" />
        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto px-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-16 items-center">

            {/* Left — text */}
            <div>
              <h1 className="font-serif text-[2.6rem] sm:text-5xl text-stone-900 leading-[1.12] mb-5 tracking-tight">
                Your Wedding,<br />Beautifully Managed.
              </h1>
              <p className="text-stone-500 text-[1.05rem] leading-relaxed mb-8 max-w-sm">
                Digital RSVPs, gift registry, guest management — one link, zero stress.
              </p>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white font-semibold rounded-xl transition-colors text-[0.95rem] shadow-lg shadow-rose-200"
              >
                Plan Your Wedding
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
            </div>

            {/* Right — phone mockup */}
            <div className="flex justify-center sm:justify-end">
              <PhoneMockup />
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 2: THE PROBLEM ── */}
      <section className="py-16 sm:py-20 bg-[#fdf8f4]">
        <div className="max-w-xl mx-auto px-5">
          <h2 className="font-serif text-2xl sm:text-3xl text-stone-800 mb-10">Been here before?</h2>
          <div className="flex flex-col gap-6">
            {problems.map(({ Icon, text }) => (
              <div key={text} className="flex items-start gap-4">
                <Icon className="w-[18px] h-[18px] text-rose-400 mt-[3px] shrink-0" strokeWidth={1.75} />
                <span className="text-stone-600 text-[0.95rem] leading-snug">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: ADMIN PREVIEW ── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <h2 className="font-serif text-2xl sm:text-3xl text-stone-800 text-center mb-10">
            Everything in one dashboard.
          </h2>
          <AdminMockup />
          {/* Feature photo cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">

            {[
              {
                img: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=80',
                alt: 'Wedding gifts',
                Icon: Gift,
                title: 'Gift Registry',
                desc: 'Guests pick physical gifts or send cash. All tracked in one place.',
              },
              {
                img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
                alt: 'Wedding table setting',
                Icon: LayoutGrid,
                title: 'Seating Arrangement',
                desc: 'Create tables, assign guests, and fill every seat before the day.',
              },
              {
                img: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80',
                alt: 'Wedding guests',
                Icon: Users,
                title: 'Guest Management',
                desc: 'Every RSVP in one dashboard. Filter, search, and export anytime.',
              },
            ].map(({ img, alt, Icon, title, desc }) => (
              <div key={title} className="rounded-2xl overflow-hidden border border-stone-100 bg-white">
                <div className="relative h-44">
                  <Image
                    src={img}
                    alt={alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 33vw"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-4 h-4 text-rose-500" strokeWidth={1.75} />
                    <span className="font-semibold text-stone-800 text-sm">{title}</span>
                  </div>
                  <p className="text-stone-400 text-xs leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* ── SECTION 4: HOW IT WORKS ── */}
      <section className="py-16 sm:py-20 bg-[#fdf8f4]">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="font-serif text-2xl sm:text-3xl text-stone-800 text-center mb-10">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            {steps.map((step, i) => (
              <div key={step.n} className="flex flex-col gap-3">
                {/* Number */}
                <div className="w-9 h-9 rounded-full bg-rose-500 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {step.n}
                </div>
                {/* Connector for desktop (visual only) */}
                <div>
                  <p className="font-semibold text-stone-800 text-[0.95rem] leading-snug mb-1">
                    {step.title}
                  </p>
                  <p className="text-stone-400 text-sm leading-relaxed">{step.sub}</p>
                </div>
                {/* Arrow between steps on desktop */}
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: BOTTOM CTA ── */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600&q=80"
          alt="Wedding reception"
          fill
          className="object-cover"
          sizes="100vw"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/62" />
        <div className="relative z-10 text-center px-5 max-w-xl mx-auto">
          <h2 className="font-serif text-4xl sm:text-5xl text-white mb-8 leading-tight">
            Plan your wedding<br />the smart way.
          </h2>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-7 py-4 bg-rose-500 hover:bg-rose-400 active:scale-[0.98] text-white font-semibold rounded-xl transition-colors text-[0.95rem] shadow-2xl shadow-rose-900/40"
          >
            Get Started
            <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-stone-100 py-5 text-center">
        <p className="text-xs text-stone-400">NemiPlanner &copy; 2026</p>
      </footer>

    </div>
  )
}
