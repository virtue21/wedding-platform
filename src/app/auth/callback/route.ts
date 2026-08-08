import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email/sendWelcome'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Supabase can also send token_hash + type. Unlike the PKCE `code`, this
  // works in any browser — the code verifier cookie only exists in the one
  // that requested the link, so cross-device resets fail without this.
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/admin/guests'

  const supabase = createClient()
  let authError: string | null = null

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    authError = error?.message ?? null
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    authError = error?.message ?? null
  } else {
    authError = 'Missing confirmation code'
  }

  if (!authError) {
    // Password reset (or any explicit destination) — honour it.
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
          appUrl: process.env.NEXT_PUBLIC_APP_URL ?? origin,
        })
      }
    } catch (err) {
      console.error('[welcome email] failed:', err)
    }

    // Sign out so middleware doesn't intercept the redirect.
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/auth/email-verified`)
  }

  console.error('[auth callback] failed:', authError, { hasCode: !!code, hasTokenHash: !!tokenHash, type })

  // Expired or already-used links are the common case and deserve a clearer
  // message than a generic auth failure.
  const isExpired = /expired|invalid|already/i.test(authError)
  const message = isExpired
    ? 'That link has expired or was already used. Please request a new one.'
    : authError

  const dest = next === '/auth/reset-password' ? '/auth/forgot-password' : '/auth/login'
  return NextResponse.redirect(`${origin}${dest}?error=${encodeURIComponent(message)}`)
}
