import Link from 'next/link'
import { forgotPassword } from '../actions'

export default function ForgotPasswordPage({ searchParams }: { searchParams: { error?: string; success?: string } }) {
  return (
    <div className="min-h-screen bg-[#fdf8f4] flex items-center justify-center p-4">
    <div className="w-full max-w-md">
    <div className="text-center mb-8"><p className="text-2xl mb-2">💍</p><h1 className="font-serif text-2xl text-stone-800">NemiPlanner</h1></div>
    <div className="bg-white rounded-3xl shadow-sm shadow-rose-100 border border-rose-50 p-8">
      <h2 className="font-serif text-2xl text-stone-800 mb-1">Reset your password</h2>
      <p className="text-sm text-stone-400 mb-7">We&apos;ll send a reset link to your email</p>

      {searchParams.error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          {searchParams.error}
        </div>
      )}

      {searchParams.success ? (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700">
          Check your inbox — we sent you a password reset link.
        </div>
      ) : (
        <form action={forgotPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
              Email address
            </label>
            <input name="email" type="email" required placeholder="ada@example.com" className="input" />
          </div>
          <button type="submit" className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors">
            Send reset link
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-stone-400">
        <Link href="/auth/login" className="text-rose-500 font-medium hover:text-rose-600">
          ← Back to sign in
        </Link>
      </p>
    </div>
    </div>
    </div>
  )
}
