export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fdf8f4] flex items-center justify-center p-4">
      {/* Decorative background petals */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-rose-100/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-rose-100/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-2xl mb-2">💍</p>
          <h1 className="font-serif text-2xl text-stone-800 tracking-tight">
            Wedding Guest Management
          </h1>
        </div>
        {children}
      </div>
    </div>
  )
}
