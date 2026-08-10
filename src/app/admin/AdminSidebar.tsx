'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid, Users, Share2, Grid2x2, Gift, MessageSquare,
  CreditCard, Settings as SettingsIcon, SlidersHorizontal, ChevronLeft, type LucideIcon,
} from 'lucide-react'
import { signOut } from '@/app/auth/actions'

type NavItem = { href: string; label: string; icon: LucideIcon; count?: number }

const WEDDING_NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: LayoutGrid },
  { href: '/admin/guests', label: 'Guests', icon: Users },
  { href: '/admin/tables', label: 'Seating', icon: Share2 },
  { href: '/admin/categories', label: 'Categories', icon: Grid2x2 },
]

const GUEST_PAGE_NAV: NavItem[] = [
  { href: '/admin/registry', label: 'Registry', icon: Gift },
  { href: '/admin/wall', label: 'Wall', icon: MessageSquare },
]

const ACCOUNT_NAV: NavItem[] = [
  { href: '/admin/plans', label: 'Plan', icon: CreditCard },
  { href: '/admin/settings', label: 'Settings', icon: SettingsIcon },
  { href: '/setup', label: 'Setup', icon: SlidersHorizontal },
]

const COLLAPSE_KEY = 'nemi_sidebar_collapsed'

function NavSection({ title, items, pathname, counts, collapsed }: {
  title: string
  items: NavItem[]
  pathname: string
  counts?: Record<string, number>
  collapsed: boolean
}) {
  return (
    <div>
      {!collapsed && (
        <p className="px-3 text-[11px] font-medium uppercase tracking-wide text-stone-400 mb-1.5">{title}</p>
      )}
      <div className="space-y-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
          const count = counts?.[href]
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                collapsed ? 'justify-center' : 'justify-between'
              } ${
                active
                  ? 'bg-rose-50 text-rose-600 font-medium'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
              }`}
            >
              <span className={`flex items-center gap-2.5 ${collapsed ? '' : 'min-w-0'}`}>
                <Icon size={17} className={`shrink-0 ${active ? 'text-rose-500' : 'text-stone-400'}`} />
                {!collapsed && <span className="truncate">{label}</span>}
              </span>
              {!collapsed && typeof count === 'number' && count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-rose-100 text-rose-600' : 'bg-stone-100 text-stone-500'}`}>
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

type Props = {
  coupleNames: string | null
  weddingDate: string | null
  guestSlug: string | null
  counts: {
    guests: number
    registry: number
    wall: number
  }
}

export default function AdminSidebar({ coupleNames, guestSlug, counts }: Props) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1')
  }, [])

  function toggleCollapsed() {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      return next
    })
  }

  const navCounts: Record<string, number> = {
    '/admin/guests': counts.guests,
    '/admin/registry': counts.registry,
    '/admin/wall': counts.wall,
  }

  return (
    <aside className={`relative shrink-0 border-r border-rose-100 bg-white flex flex-col h-screen sticky top-0 transition-[width] duration-200 ${collapsed ? 'w-[72px]' : 'w-64'}`}>
      <div className={`px-4 py-5 flex items-center gap-2.5 border-b border-rose-50 ${collapsed ? 'justify-center px-2' : ''}`}>
        <Image src="/icon.svg" alt="NemiPlanner" width={32} height={32} className="rounded-lg shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-serif text-stone-800 text-base leading-none">NemiPlanner</p>
            {coupleNames && (
              <p className="text-[11px] text-stone-400 leading-none mt-1 truncate">{coupleNames}</p>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute top-5 -right-3 w-6 h-6 flex items-center justify-center bg-white border border-rose-100 rounded-full text-stone-400 hover:text-stone-700 shadow-sm transition-colors"
      >
        <ChevronLeft size={14} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
      </button>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        <NavSection title="Wedding" items={WEDDING_NAV} pathname={pathname} counts={navCounts} collapsed={collapsed} />
        <NavSection title="Guest page" items={GUEST_PAGE_NAV} pathname={pathname} counts={navCounts} collapsed={collapsed} />
        <NavSection title="Account" items={ACCOUNT_NAV} pathname={pathname} collapsed={collapsed} />
      </nav>

      <div className="px-3 py-4 border-t border-rose-50 space-y-1">
        {guestSlug && (
          <Link
            href={`/${guestSlug}`}
            target="_blank"
            title={collapsed ? 'View guest page' : undefined}
            className={`block px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-colors truncate ${collapsed ? 'text-center' : ''}`}
          >
            {collapsed ? '↗' : 'View guest page ↗'}
          </Link>
        )}
        <form action={signOut}>
          <button
            type="submit"
            title={collapsed ? 'Sign out' : undefined}
            className={`w-full px-3 py-2 text-sm text-stone-400 hover:text-stone-600 transition-colors ${collapsed ? 'text-center' : 'text-left'}`}
          >
            {collapsed ? '⏻' : 'Sign out'}
          </button>
        </form>
      </div>
    </aside>
  )
}
