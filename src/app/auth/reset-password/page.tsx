'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [isPending, start] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    start(async () => {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        return
      }
      await supabase.auth.signOut()
      router.push('/auth/login?success=Password+updated+successfully')
    })
  }

  return (
    <div className="min-h-screen bg-[#fdf8f4] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-2xl mb-2">💍</p>
          <h1 className="font-serif text-2xl text-stone-800">NemiPlanner</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-sm shadow-rose-100 border border-rose-50 p-8">
          <h2 className="font-serif text-2xl text-stone-800 mb-1">Set new password</h2>
          <p className="text-sm text-stone-400 mb-7">Choose a strong password for your account</p>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Repeat your password"
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {isPending ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
