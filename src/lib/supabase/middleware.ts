import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './database.types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // A cold or struggling database must not hang every request until the
  // platform kills the middleware with a 504. Cap the wait and treat a
  // timeout as "not signed in" — worst case someone is asked to log in again.
  const user = await Promise.race([
    supabase.auth.getUser().then(res => res.data.user),
    new Promise<null>(resolve => setTimeout(() => resolve(null), 5000)),
  ])

  const { pathname } = request.nextUrl

  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/setup')
  const isAuthRoute = pathname.startsWith('/auth')

  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Allow reset-password page even when logged in — session was just established
  // by exchangeCodeForSession and the user still needs to set their new password.
  if (isAuthRoute && user && pathname !== '/auth/reset-password') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/guests'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
