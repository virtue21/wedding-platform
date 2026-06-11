import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isValidSession, SUPERADMIN_COOKIE } from '@/lib/superadmin-session'
import SuperadminNav from './SuperadminNav'

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const session = cookieStore.get(SUPERADMIN_COOKIE)

  if (!isValidSession(session?.value)) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-stone-950 flex">
      <SuperadminNav />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
