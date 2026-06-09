import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function EmailVerifiedPage() {
  return (
    <div className="min-h-screen bg-[#fdf8f4] flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-rose-100/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-rose-100/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl">💍</span>
          <h1 className="font-serif text-2xl text-stone-800 tracking-tight mt-1">NemiPlanner</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-sm shadow-rose-100 border border-rose-50 p-10 text-center">

          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-500" strokeWidth={1.5} />
          </div>

          <h2 className="font-serif text-2xl text-stone-800 mb-2">Email verified</h2>
          <p className="text-sm text-stone-400 leading-relaxed mb-8">
            Your email address has been confirmed.<br />
            You&apos;re all set — sign in to start planning your wedding.
          </p>

          <Link
            href="/auth/login"
            className="block w-full py-3.5 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Sign in to your account
          </Link>

          <p className="text-xs text-stone-300 mt-5">
            Already signed in?{' '}
            <Link href="/admin/guests" className="text-rose-400 hover:text-rose-500 transition-colors">
              Go to dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
