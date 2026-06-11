'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/superadmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Login failed')
        return
      }
      router.push('/superadmin')
      router.refresh()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-stone-400 text-xs mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="admin@nemiplanner.xyz"
          className="w-full px-4 py-3 bg-stone-900 border border-stone-700 rounded-xl text-white text-sm placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50"
        />
      </div>
      <div>
        <label className="block text-stone-400 text-xs mb-1.5">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          className="w-full px-4 py-3 bg-stone-900 border border-stone-700 rounded-xl text-white text-sm placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50"
        />
      </div>

      {error && (
        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-medium text-sm rounded-xl transition-colors"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
