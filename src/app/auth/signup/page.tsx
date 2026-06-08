import Link from 'next/link'
import { signUp } from '../actions'

export default function SignUpPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm shadow-rose-100 border border-rose-50 p-8">
      <h2 className="font-serif text-2xl text-stone-800 mb-1">Create your account</h2>
      <p className="text-sm text-stone-400 mb-7">Manage your guest list here</p>

      {searchParams.error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          {searchParams.error}
        </div>
      )}

      <form action={signUp} className="space-y-4">
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

        <button type="submit" className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors mt-2">
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-400">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-rose-500 font-medium hover:text-rose-600">
          Sign in
        </Link>
      </p>
    </div>
  )
}
