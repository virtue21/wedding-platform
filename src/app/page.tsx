import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProblemSection from './landing/ProblemSection'
import FeaturesSection from './landing/FeaturesSection'
import ScreenshotSection from './landing/ScreenshotSection'

export default async function RootPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/admin/guests')

  return (
    <div className="min-h-screen bg-[#fdf8f4] font-sans overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <span className="font-serif text-xl text-white drop-shadow-md tracking-tight">NemiPlanner</span>
          <Link
            href="/auth/signup"
            className="text-sm font-semibold text-white border border-white/30 hover:border-white/70 hover:bg-white/10 px-5 py-2.5 rounded-full backdrop-blur-sm transition-all"
          >
            Plan Your Wedding
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-[95vh] flex items-center justify-center text-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=85"
          alt="Wedding couple"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        {/* Multi-stop gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/65" />

        <div className="relative z-10 px-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-xs text-white/85 font-medium mb-8">
            💍 Wedding planning, simplified
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-[3.75rem] text-white leading-tight mb-6 drop-shadow-lg">
            Your Wedding,<br className="hidden sm:block" /> Beautifully Managed.
          </h1>
          <p className="text-white/75 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            Digital RSVPs, gift registry, guest management, and seating —<br className="hidden sm:block" />
            one link, zero stress.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-rose-500 hover:bg-rose-400 active:scale-95 text-white font-semibold rounded-2xl transition-all shadow-2xl shadow-rose-900/50 text-base"
          >
            Plan Your Wedding
            <span className="text-rose-200 text-lg leading-none">→</span>
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ── PROBLEM: sticky scroll book-turn panels ── */}
      <ProblemSection />

      {/* ── FEATURES ── */}
      <FeaturesSection />

      {/* ── SEE IT IN ACTION: sticky scroll ── */}
      <section>
        <div className="bg-[#fdf8f4] pt-16 pb-4 text-center px-5">
          <p className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-3">See it in action</p>
          <h2 className="font-serif text-2xl sm:text-3xl text-stone-800">
            Your dashboard, always in control.
          </h2>
        </div>
        <ScreenshotSection />
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-white border-y border-stone-100 py-20">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-center text-xs text-stone-400 uppercase tracking-widest font-medium mb-3">How it works</p>
          <h2 className="font-serif text-2xl sm:text-3xl text-stone-800 text-center mb-12">Three steps.</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-0 max-w-2xl mx-auto">
            {[
              { n: '1', label: 'Sign up', sub: 'Create your wedding in minutes' },
              { n: '2', label: 'Share your link', sub: 'One QR code for everything' },
              { n: '3', label: 'Manage', sub: 'Watch RSVPs come in live' },
            ].map((step) => (
              <div key={step.n} className="flex sm:flex-col items-center gap-5 sm:gap-4 flex-1 sm:text-center">
                <div className="w-14 h-14 rounded-full bg-rose-500 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-200">
                  {step.n}
                </div>
                <div>
                  <p className="font-semibold text-stone-800 text-base">{step.label}</p>
                  <p className="text-sm text-stone-400 mt-0.5">{step.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="relative py-32 text-center px-5 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600&q=80"
          alt="Wedding reception"
          fill
          className="object-cover"
          sizes="100vw"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/58" />
        <div className="relative z-10">
          <h2 className="font-serif text-4xl sm:text-5xl text-white mb-4 drop-shadow-lg">Ready?</h2>
          <p className="text-white/65 text-base mb-10">Plan your wedding the smart way.</p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-rose-500 hover:bg-rose-400 active:scale-95 text-white font-semibold rounded-2xl transition-all shadow-2xl shadow-rose-900/50 text-base"
          >
            Plan Your Wedding
            <span className="text-rose-200 text-lg leading-none">→</span>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-stone-100 py-8 px-5 bg-[#fdf8f4]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-serif text-stone-700 text-lg">NemiPlanner</span>
          <p className="text-xs text-stone-400">© {new Date().getFullYear()} NemiPlanner. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
