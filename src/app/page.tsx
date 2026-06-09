import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProblemCards from './landing/ProblemCards'
import ScreenshotCarousel from './landing/ScreenshotCarousel'

export default async function RootPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/admin/guests')

  return (
    <div className="min-h-screen bg-[#fdf8f4] font-sans overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <span className="font-serif text-xl text-white drop-shadow">NemiPlanner</span>
          <Link
            href="/auth/signup"
            className="text-sm font-medium text-white/90 hover:text-white border border-white/30 hover:border-white/60 px-4 py-2 rounded-full backdrop-blur-sm transition-all"
          >
            Plan Your Wedding
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-[92vh] flex items-center justify-center text-center overflow-hidden">
        {/* Background image */}
        <Image
          src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80"
          alt="Wedding couple"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />

        {/* Content */}
        <div className="relative z-10 px-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-xs text-white/90 font-medium mb-8">
            💍 Wedding planning, simplified
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white leading-tight mb-6 drop-shadow-lg">
            Your Wedding,<br className="hidden sm:block" /> Beautifully Managed.
          </h1>
          <p className="text-white/80 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            Digital RSVPs, gift registry, guest management, and seating —<br className="hidden sm:block" />
            one link, zero stress.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-rose-500 hover:bg-rose-400 text-white font-semibold rounded-2xl transition-all shadow-2xl shadow-rose-900/40 text-base"
          >
            Plan Your Wedding
            <span className="text-rose-200">→</span>
          </Link>
        </div>

        {/* Bottom fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ── PROBLEM ── */}
      <section className="relative py-20 overflow-hidden">
        {/* Soft floral texture background */}
        <div className="absolute inset-0 pointer-events-none">
          <Image
            src="https://images.unsplash.com/photo-1490750967868-88df5691cc31?w=1600&q=60"
            alt=""
            fill
            className="object-cover opacity-[0.07]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#fdf8f4]/90" />
        </div>
        <div className="relative max-w-5xl mx-auto px-5">
          <p className="text-center text-xs text-stone-400 uppercase tracking-widest font-medium mb-3">Sound familiar?</p>
          <h2 className="font-serif text-2xl sm:text-3xl text-stone-800 text-center mb-12">
            Wedding planning has a chaos problem.
          </h2>
          <ProblemCards />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-center text-xs text-stone-400 uppercase tracking-widest font-medium mb-3">What you get</p>
          <h2 className="font-serif text-2xl sm:text-3xl text-stone-800 text-center mb-16">
            Everything in one place.
          </h2>

          <div className="space-y-16">
            {[
              {
                icon: '📲',
                title: 'Digital RSVP',
                desc: 'Share one QR code or link. Guests confirm attendance in 30 seconds — no app, no login.',
                img: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80',
                imgAlt: 'Phone showing QR code',
                reverse: false,
              },
              {
                icon: '🎁',
                title: 'Gift Registry',
                desc: 'List physical gifts with checkout links, or let guests send cash equivalents directly. All in one page.',
                img: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&q=80',
                imgAlt: 'Wedding gifts',
                reverse: true,
              },
              {
                icon: '👥',
                title: 'Guest Management',
                desc: 'Every RSVP lands in your dashboard. Filter by side or category, search by name, export to CSV.',
                img: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&q=80',
                imgAlt: 'Wedding guests',
                reverse: false,
              },
              {
                icon: '🪑',
                title: 'Seating',
                desc: 'Assign guests to tables whenever you\'re ready. See capacity at a glance, update anytime.',
                img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80',
                imgAlt: 'Elegant table setting',
                reverse: true,
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`flex flex-col ${f.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-12`}
              >
                {/* Image */}
                <div className="w-full md:w-1/2 relative rounded-2xl overflow-hidden shadow-xl shadow-stone-200/60" style={{ aspectRatio: '4/3' }}>
                  <Image
                    src={f.img}
                    alt={f.imgAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                </div>

                {/* Text */}
                <div className="w-full md:w-1/2">
                  <span className="text-4xl block mb-4">{f.icon}</span>
                  <h3 className="font-serif text-2xl text-stone-800 mb-3">{f.title}</h3>
                  <p className="text-stone-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEE IT IN ACTION ── */}
      <section className="py-20 bg-[#fdf8f4]">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs text-stone-400 uppercase tracking-widest font-medium mb-3 px-5">See it in action</p>
          <h2 className="font-serif text-2xl sm:text-3xl text-stone-800 text-center mb-12 px-5">
            Your dashboard, always in control.
          </h2>
          <ScreenshotCarousel />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-white border-y border-stone-100 py-20">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-center text-xs text-stone-400 uppercase tracking-widest font-medium mb-3">How it works</p>
          <h2 className="font-serif text-2xl sm:text-3xl text-stone-800 text-center mb-12">Three steps.</h2>
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-6 max-w-2xl mx-auto">
            {[
              { n: '1', label: 'Sign up', sub: 'Create your wedding in minutes' },
              { n: '2', label: 'Share your link', sub: 'One QR code for everything' },
              { n: '3', label: 'Manage', sub: 'Watch RSVPs come in live' },
            ].map((step, i, arr) => (
              <div key={step.n} className="flex sm:flex-col items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-rose-500 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-lg shadow-rose-200">
                  {step.n}
                </div>
                <div className="sm:text-center">
                  <p className="font-semibold text-stone-800">{step.label}</p>
                  <p className="text-sm text-stone-400 mt-0.5">{step.sub}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="hidden sm:block text-rose-300 text-2xl font-light self-start mt-2">›</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="relative py-28 text-center px-5 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600&q=80"
          alt="Wedding reception"
          fill
          className="object-cover"
          sizes="100vw"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10">
          <h2 className="font-serif text-4xl sm:text-5xl text-white mb-4 drop-shadow-lg">Ready?</h2>
          <p className="text-white/70 text-base mb-10">Join couples already using NemiPlanner.</p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-rose-500 hover:bg-rose-400 text-white font-semibold rounded-2xl transition-all shadow-2xl shadow-rose-900/40 text-base"
          >
            Plan Your Wedding
            <span className="text-rose-200">→</span>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-stone-100 py-8 px-5 bg-[#fdf8f4]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-serif text-stone-700">NemiPlanner</span>
          <p className="text-xs text-stone-400">© {new Date().getFullYear()} NemiPlanner. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
