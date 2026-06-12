'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/superadmin',               icon: '📊', label: 'Dashboard'     },
  { href: '/superadmin/customers',     icon: '👥', label: 'Customers'     },
  { href: '/superadmin/subscriptions', icon: '💳', label: 'Subscriptions' },
  { href: '/superadmin/plans',         icon: '📋', label: 'Plans'         },
]

export default function SuperadminNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/superadmin/logout', { method: 'POST' })
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside className="w-56 bg-stone-900 border-r border-stone-800 flex flex-col h-screen shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <span className="text-xl">💍</span>
          <div>
            <p className="text-white text-sm font-semibold leading-none">NemiPlanner</p>
            <p className="text-rose-400 text-xs mt-0.5">Operations</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(item => {
          const isActive = item.href === '/superadmin'
            ? pathname === '/superadmin'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-stone-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-stone-500 hover:text-stone-300 hover:bg-stone-800 w-full transition-colors"
        >
          <span>🚪</span>
          Sign out
        </button>
      </div>
    </aside>
  )
}
