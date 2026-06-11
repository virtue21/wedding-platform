import Link from 'next/link'
import LoginForm from './LoginForm'

export default function LoginPage({ searchParams }: { searchParams: { error?: string; confirmed?: string } }) {
  return (
    <div className="min-h-screen bg-[#fdf8f4] flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-rose-100/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-rose-100/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-2xl mb-2">💍</p>
          <h1 className="font-serif text-2xl text-stone-800 tracking-tight">NemiPlanner</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-sm shadow-rose-100 border border-rose-50 p-8">
          <h2 className="font-serif text-2xl text-stone-800 mb-1">Welcome back</h2>
          <p className="text-sm text-stone-400 mb-7">Sign in to your wedding dashboard</p>

          {searchParams.confirmed && (
            <div className="mb-5 p-3.5 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700 font-medium">
              Email confirmed! Sign in to start planning.
            </div>
          )}

          {searchParams.error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {searchParams.error}
            </div>
          )}

          <LoginForm />

          <p className="mt-6 text-center text-sm text-stone-400">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-rose-500 font-medium hover:text-rose-600">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
