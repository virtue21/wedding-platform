import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isValidSession, SUPERADMIN_COOKIE } from '@/lib/superadmin-session'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Superadmin routes — separate auth, no Supabase involved
  if (pathname.startsWith('/superadmin')) {
    // Let the login page and its API through
    if (pathname === '/superadmin/login' || pathname.startsWith('/api/superadmin/')) {
      return NextResponse.next()
    }
    const session = request.cookies.get(SUPERADMIN_COOKIE)
    if (!isValidSession(session?.value)) {
      return NextResponse.redirect(new URL('/superadmin/login', request.url))
    }
    return NextResponse.next()
  }

  // All other routes go through Supabase session refresh
  return updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
