import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function LinkExpiredPage({
  searchParams,
}: {
  searchParams: { resent?: string }
}) {
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
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-amber-400" strokeWidth={1.5} />
          </div>

          <h2 className="font-serif text-2xl text-stone-800 mb-2">Link expired</h2>
          <p className="text-sm text-stone-400 leading-relaxed mb-8">
            This confirmation link has expired or has already been used.<br />
            Sign in to request a new one, or create a new account.
          </p>

          {searchParams.resent && (
            <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 font-medium">
              A new confirmation email has been sent. Check your inbox.
            </div>
          )}

          {/* Primary CTA */}
          <Link
            href="/auth/login"
            className="block w-full py-3.5 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-colors mb-3"
          >
            Go to sign in
          </Link>

          <Link
            href="/auth/signup"
            className="block w-full py-3.5 border border-rose-100 hover:border-rose-200 text-stone-500 hover:text-stone-700 text-sm font-medium rounded-xl transition-colors"
          >
            Create a new account
          </Link>

          <p className="text-xs text-stone-300 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-rose-400 hover:text-rose-500 transition-colors">
              Sign in
            </Link>{' '}
            to resend the confirmation email from your profile.
          </p>
        </div>
      </div>
    </div>
  )
}
