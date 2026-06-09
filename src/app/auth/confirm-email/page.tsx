'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, AlertCircle } from 'lucide-react'

export default function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: { token_hash?: string; type?: string }
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  const { token_hash, type } = searchParams
  const valid = token_hash && type

  async function handleConfirm() {
    if (!token_hash || !type) return
    setStatus('loading')

    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'signup' | 'email',
    })

    if (error) {
      setStatus('error')
      setErrorMsg(
        error.message.toLowerCase().includes('expired') || error.message.toLowerCase().includes('invalid')
          ? 'This link has already been used or has expired. Please request a new confirmation email.'
          : error.message
      )
      return
    }

    // Sign out so the user goes through the normal login flow
    await supabase.auth.signOut()
    router.push('/auth/email-verified')
  }

  return (
    <div className="min-h-screen bg-[#fdf8f4] flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-rose-100/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-rose-100/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-2xl">💍</span>
          <h1 className="font-serif text-2xl text-stone-800 tracking-tight mt-1">NemiPlanner</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-sm shadow-rose-100 border border-rose-50 p-10 text-center">

          {!valid ? (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-amber-400" strokeWidth={1.5} />
              </div>
              <h2 className="font-serif text-2xl text-stone-800 mb-2">Invalid link</h2>
              <p className="text-sm text-stone-400 leading-relaxed mb-8">
                This confirmation link is missing required parameters.<br />
                Please use the link from your confirmation email.
              </p>
              <a href="/auth/signup" className="block w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-colors">
                Back to sign up
              </a>
            </>
          ) : status === 'error' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-amber-400" strokeWidth={1.5} />
              </div>
              <h2 className="font-serif text-2xl text-stone-800 mb-2">Link expired</h2>
              <p className="text-sm text-stone-400 leading-relaxed mb-8">{errorMsg}</p>
              <a href="/auth/signup" className="block w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-colors">
                Sign up again
              </a>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-rose-400" strokeWidth={1.5} />
              </div>
              <h2 className="font-serif text-2xl text-stone-800 mb-2">Confirm your email</h2>
              <p className="text-sm text-stone-400 leading-relaxed mb-8">
                Click the button below to verify your email address<br />and activate your NemiPlanner account.
              </p>
              <button
                onClick={handleConfirm}
                disabled={status === 'loading'}
                className="block w-full py-3.5 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
              >
                {status === 'loading' ? 'Confirming…' : 'Confirm my email address'}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
