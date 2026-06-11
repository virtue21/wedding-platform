'use client'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { track } from '@/lib/mixpanel'

export default function LandingCTA() {
  return (
    <Link
      href="/auth/signup"
      onClick={() => track('cta_clicked', { cta: 'plan_your_wedding' })}
      className="inline-flex items-center gap-2 px-6 py-3.5 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white font-semibold rounded-xl transition-colors text-[0.95rem] shadow-lg shadow-rose-200"
    >
      Plan Your Wedding
      <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
    </Link>
  )
}
