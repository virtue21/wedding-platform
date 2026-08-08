import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isValidSession, SUPERADMIN_COOKIE } from '@/lib/superadmin-session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Superadmin routes — protected by session cookie, no Supabase involved
  if (pathname.startsWith('/superadmin')) {
    const session = request.cookies.get(SUPERADMIN_COOKIE)
    if (!isValidSession(session?.value)) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return NextResponse.next()
  }

  // Only routes that actually gate on a session need Supabase. Guest pages,
  // the landing page and API routes don't — and making them wait on an auth
  // round-trip means a slow database takes the public site down with it.
  const needsSession =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/setup') ||
    pathname.startsWith('/auth')

  if (!needsSession) return NextResponse.next()

  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
