'use client'

import { useRef } from 'react'
import { signUp } from '../actions'
import { track } from '@/lib/mixpanel'

export default function SignupForm() {
  const startedRef = useRef(false)

  function handleFocus() {
    if (!startedRef.current) {
      startedRef.current = true
      track('signup_started')
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget
    const bride_name = (form.elements.namedItem('bride_name') as HTMLInputElement)?.value ?? ''
    const groom_name = (form.elements.namedItem('groom_name') as HTMLInputElement)?.value ?? ''
    track('signup_completed', { bride_name, groom_name })
  }

  return (
    <form action={signUp} onSubmit={handleSubmit} onFocus={handleFocus} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
            Bride&apos;s name
          </label>
          <input name="bride_name" type="text" required placeholder="Ada" className="input" />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
            Groom&apos;s name
          </label>
          <input name="groom_name" type="text" required placeholder="Chike" className="input" />
        </div>
      </div>

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
        <input name="password" type="password" required minLength={6} placeholder="At least 6 characters" className="input" />
      </div>

      <button type="submit" className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl transition-colors mt-2 shadow-lg shadow-rose-200">
        Create account →
      </button>
    </form>
  )
}
