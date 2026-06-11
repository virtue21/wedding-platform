import LoginForm from './LoginForm'

export default function SuperadminLoginPage() {
  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-500/20 mb-4">
            <span className="text-2xl">💍</span>
          </div>
          <h1 className="text-white font-semibold text-xl">NemiPlanner Admin</h1>
          <p className="text-stone-400 text-sm mt-1">Internal operations console</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
