import Link from 'next/link'
import Image from 'next/image'
import SignupForm from './SignupForm'

export default function SignUpPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="min-h-screen flex">
      {/* Left — wedding image (hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=85"
          alt="Wedding couple"
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/50" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <p className="font-serif text-white text-3xl leading-snug mb-3">
            &ldquo;The most stress-free part<br />of our wedding planning.&rdquo;
          </p>
          <p className="text-white/60 text-sm">— Ada & Chike, Lagos 2025</p>
        </div>
        {/* Brand overlay */}
        <div className="absolute top-8 left-8 z-10">
          <span className="font-serif text-white text-xl tracking-tight drop-shadow">NemiPlanner</span>
        </div>
      </div>

      {/* Right — form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-[#fdf8f4] px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="md:hidden text-center mb-8">
            <span className="font-serif text-2xl text-stone-800">NemiPlanner</span>
          </div>

          <h2 className="font-serif text-3xl text-stone-800 mb-1">Start Planning Your Wedding</h2>
          <p className="text-sm text-stone-400 mb-8">Create your account to get started.</p>

          {searchParams.error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {searchParams.error}
            </div>
          )}

          <SignupForm />

          <p className="mt-6 text-center text-sm text-stone-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-rose-500 font-medium hover:text-rose-600">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
