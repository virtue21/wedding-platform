import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin/guests'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // If next is explicitly set (e.g. password reset), honour it.
      // Otherwise redirect to sign-in with a confirmation success banner.
      if (next !== '/admin/guests') {
        return NextResponse.redirect(`${origin}${next}`)
      }
      return NextResponse.redirect(`${origin}/auth/login?confirmed=1`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=Could+not+authenticate`)
}
