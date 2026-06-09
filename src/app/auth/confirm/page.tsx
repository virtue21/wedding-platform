import Link from 'next/link'
import { Mail } from 'lucide-react'

export default function ConfirmPage({ searchParams }: { searchParams: { email?: string } }) {
  const email = searchParams.email

  return (
    <div className="min-h-screen bg-[#fdf8f4] flex items-center justify-center p-4">
      {/* Soft background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-rose-100/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-rose-100/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl text-stone-800 tracking-tight">NemiPlanner</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm shadow-rose-100 border border-rose-50 p-8 text-center">

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-7 h-7 text-rose-400" strokeWidth={1.5} />
          </div>

          <h2 className="font-serif text-2xl text-stone-800 mb-2">Check your inbox</h2>
          <p className="text-sm text-stone-400 leading-relaxed mb-1">
            We sent a confirmation link to
          </p>
          {email && (
            <p className="text-sm font-semibold text-stone-700 mb-5">{email}</p>
          )}
          <p className="text-sm text-stone-400 leading-relaxed mb-8">
            Click the link in the email to activate your account.
            Once confirmed, you&apos;ll be taken straight to your dashboard.
          </p>

          {/* Steps */}
          <div className="flex items-start gap-3 text-left bg-[#fdf8f4] rounded-2xl p-4 mb-8">
            {[
              { n: '1', text: 'Open the email from NemiPlanner' },
              { n: '2', text: 'Click "Confirm Email"' },
              { n: '3', text: "You're in — start planning" },
            ].map((step) => (
              <div key={step.n} className="flex flex-col items-center gap-1.5 flex-1 text-center">
                <div className="w-7 h-7 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {step.n}
                </div>
                <p className="text-[11px] text-stone-500 leading-snug">{step.text}</p>
              </div>
            ))}
          </div>

          <Link
            href="/auth/login"
            className="block w-full py-3 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Go to sign in
          </Link>

          <p className="text-xs text-stone-300 mt-5">
            Didn&apos;t get the email? Check your spam folder.
          </p>

        </div>
      </div>
    </div>
  )
}
