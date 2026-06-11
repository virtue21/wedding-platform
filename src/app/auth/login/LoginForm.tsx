'use client'

import Link from 'next/link'
import { login } from '../actions'
import { track } from '@/lib/mixpanel'

export default function LoginForm() {
  function handleSubmit() {
    track('login_completed')
  }

  return (
    <form action={login} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
          Email address
        </label>
        <input name="email" type="email" required placeholder="ada@example.com" className="input" />
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
          Password
        </label>
        <input name="password" type="password" required placeholder="Your password" className="input" />
        <div className="mt-2 text-right">
          <Link href="/auth/forgot-password" className="text-xs text-stone-400 hover:text-rose-500 transition-colors">
            Forgot password?
          </Link>
        </div>
      </div>

      <button type="submit" className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors mt-2">
        Sign in
      </button>
    </form>
  )
}
