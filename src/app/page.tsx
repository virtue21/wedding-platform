import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProblemCards from './landing/ProblemCards'

export default async function RootPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/admin/guests')

  return (
    <div className="min-h-screen bg-[#fdf8f4] font-sans">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#fdf8f4]/90 backdrop-blur-sm border-b border-rose-100">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="font-serif text-lg text-stone-800 tracking-tight">NemiPlanner</span>
          <Link
            href="/auth/login"
            className="text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors"
          >
            Sign in →
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-5xl mx-auto px-5 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-full text-xs text-rose-600 font-medium mb-8">
          💍 Wedding planning, simplified
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-stone-900 leading-tight mb-6 max-w-3xl mx-auto">
          Your Wedding,<br className="hidden sm:block" /> Beautifully Managed.
        </h1>
        <p className="text-stone-500 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
          Digital RSVPs, gift registry, guest management, and seating —<br className="hidden sm:block" />
          one link, zero stress.
        </p>
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-2 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-rose-200 text-base"
        >
          Plan Your Wedding
          <span className="text-rose-200">→</span>
        </Link>
        <p className="mt-4 text-xs text-stone-400">Free to start. No credit card.</p>
      </section>

      {/* ── PROBLEM ── */}
      <section className="bg-white border-y border-stone-100 py-20">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-center text-xs text-stone-400 uppercase tracking-widest font-medium mb-3">Sound familiar?</p>
          <h2 className="font-serif text-2xl sm:text-3xl text-stone-800 text-center mb-12">
            Wedding planning has a chaos problem.
          </h2>
          <ProblemCards />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-center text-xs text-stone-400 uppercase tracking-widest font-medium mb-3">What you get</p>
          <h2 className="font-serif text-2xl sm:text-3xl text-stone-800 text-center mb-12">
            Everything in one place.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '📲', title: 'Digital RSVP', desc: 'QR code or link. Guests confirm in 30 seconds.' },
              { icon: '🎁', title: 'Gift Registry', desc: 'Physical gifts or cash equivalent — guests choose.' },
              { icon: '👥', title: 'Guest Management', desc: 'Filter, search, and export your full guest list.' },
              { icon: '🪑', title: 'Seating', desc: 'Assign tables whenever you\'re ready.' },
            ].map(f => (
              <div key={f.title} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-3xl block mb-4">{f.icon}</span>
                <h3 className="font-semibold text-stone-800 mb-2">{f.title}</h3>
                <p className="text-sm text-stone-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-white border-y border-stone-100 py-20">
        <div className="max-w-5xl mx-auto px-5">
          <p className="text-center text-xs text-stone-400 uppercase tracking-widest font-medium mb-3">How it works</p>
          <h2 className="font-serif text-2xl sm:text-3xl text-stone-800 text-center mb-12">Three steps.</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0 max-w-2xl mx-auto">
            {[
              { n: '1', label: 'Sign up', sub: 'Create your wedding in minutes' },
              { n: '2', label: 'Share your link', sub: 'One QR code for everything' },
              { n: '3', label: 'Manage', sub: 'Watch RSVPs come in live' },
            ].map((step, i) => (
              <div key={step.n} className="flex sm:flex-col items-center gap-4 sm:gap-0 flex-1">
                <div className="flex items-center gap-4 sm:flex-col sm:gap-0 flex-1 sm:text-center">
                  <div className="w-12 h-12 rounded-full bg-rose-500 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-md shadow-rose-200">
                    {step.n}
                  </div>
                  <div className="sm:mt-4">
                    <p className="font-semibold text-stone-800 text-sm">{step.label}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{step.sub}</p>
                  </div>
                </div>
                {i < 2 && (
                  <div className="hidden sm:flex flex-1 items-center justify-center">
                    <div className="w-full h-px bg-rose-100 relative">
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-rose-300 text-xs">›</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-24 text-center px-5">
        <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 mb-4">Ready?</h2>
        <p className="text-stone-400 text-base mb-8">Join couples already using NemiPlanner.</p>
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-2 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-2xl transition-colors shadow-lg shadow-rose-200 text-base"
        >
          Plan Your Wedding
          <span className="text-rose-200">→</span>
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-stone-100 py-8 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-serif text-stone-700">NemiPlanner</span>
          <p className="text-xs text-stone-400">© {new Date().getFullYear()} NemiPlanner. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
