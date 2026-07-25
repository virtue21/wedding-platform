import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email/sendWelcome'

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

      // Email confirmation flow: send the welcome email before signing out.
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('bride_name, groom_name')
            .eq('id', user.id)
            .single()
          await sendWelcomeEmail(user.email, {
            brideName: profile?.bride_name ?? 'there',
            groomName: profile?.groom_name ?? '',
            appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://nemiplanner.xyz',
          })
        }
      } catch (err) {
        console.error('[welcome email] failed:', err)
      }

      // Sign the user out immediately so the middleware doesn't
      // intercept the redirect to the verified page.
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/auth/email-verified`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=Could+not+authenticate`)
}
