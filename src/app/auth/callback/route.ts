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
      if (next !== '/admin/guests') {
        return NextResponse.redirect(`${origin}${next}`)
      }
      // Email confirmation flow: sign the user out immediately so the
      // middleware doesn't intercept the redirect to the verified page.
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/auth/email-verified`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=Could+not+authenticate`)
}
