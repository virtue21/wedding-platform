import Link from 'next/link'

export default function ConfirmPage({ searchParams }: { searchParams: { email?: string } }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm shadow-rose-100 border border-rose-50 p-8 text-center">
      <div className="text-5xl mb-5">📬</div>
      <h2 className="font-serif text-2xl text-stone-800 mb-2">Check your email</h2>
      <p className="text-sm text-stone-400 mb-1">We sent a confirmation link to</p>
      {searchParams.email && (
        <p className="text-sm font-medium text-stone-700 mb-5">{searchParams.email}</p>
      )}
      <p className="text-sm text-stone-400 mb-8">
        Click the link in that email to activate your account, then come back here to sign in.
      </p>
      <Link href="/auth/login" className="block w-full py-3 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors">
        Go to sign in
      </Link>
    </div>
  )
}
