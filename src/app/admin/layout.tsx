import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/auth/actions'
import type { Database } from '@/lib/supabase/database.types'
import AdminIdentify from './AdminIdentify'

type Profile = Database['public']['Tables']['user_profiles']['Row']

const NAV = [
  { href: '/admin/guests',     label: 'Guests',     icon: '👥' },
  { href: '/admin/registry',   label: 'Registry',   icon: '🎁' },
  { href: '/admin/tables',     label: 'Seating',    icon: '🪑' },
  { href: '/admin/categories', label: 'Categories', icon: '🏷️' },
  { href: '/admin/plans',      label: 'Plans',      icon: '💳' },
  { href: '/admin/wall',       label: 'Wall',       icon: '💌' },
  { href: '/admin/settings',   label: 'Settings',   icon: '🔧' },
  { href: '/setup',            label: 'Setup',      icon: '⚙️' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('bride_name, groom_name')
    .eq('id', user.id)
    .single() as { data: Pick<Profile, 'bride_name' | 'groom_name'> | null }

  const { data: wedding } = await supabase
    .from('weddings')
    .select('slug')
    .eq('user_id', user.id)
    .single()

  const coupleNames = profile?.bride_name && profile?.groom_name
    ? `${profile.bride_name} & ${profile.groom_name}`
    : null

  return (
    <div className="min-h-screen bg-[#fdf8f4]">
      <AdminIdentify userId={user.id} />
      <header className="bg-white border-b border-rose-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <span className="text-lg leading-none">💍</span>
              <div>
                <p className="font-serif text-stone-800 text-sm leading-none tracking-tight">NemiPlanner</p>
                {coupleNames && (
                  <p className="text-[11px] text-stone-400 leading-none mt-0.5">{coupleNames}</p>
                )}
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map(({ href, label, icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-stone-500 hover:text-stone-800 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <span className="text-base leading-none">{icon}</span>
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {wedding?.slug && (
              <Link
                href={`/${wedding.slug}`}
                target="_blank"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 border border-rose-200 hover:border-rose-300 rounded-lg transition-colors bg-rose-50"
              >
                <span>🔗</span> Guest page
              </Link>
            )}
            <form action={signOut}>
              <button type="submit" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
