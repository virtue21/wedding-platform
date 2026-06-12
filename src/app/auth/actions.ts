'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SUPERADMIN_COOKIE, SUPERADMIN_COOKIE_MAX_AGE, getSessionSecret } from '@/lib/superadmin-session'

export async function signUp(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const bride_name = formData.get('bride_name') as string
  const groom_name = formData.get('groom_name') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { bride_name, groom_name },
    },
  })

  if (error) {
    const msg = error.message.toLowerCase().includes('security purposes') || error.message.toLowerCase().includes('after')
      ? 'Too many attempts. Please wait a moment and try again.'
      : error.message
    return redirect(`/auth/signup?error=${encodeURIComponent(msg)}`)
  }

  // Supabase's anti-enumeration protection means duplicate emails don't return
  // an error — the identities array is empty instead. Detect and surface it.
  if (data.user && data.user.identities?.length === 0) {
    return redirect(`/auth/signup?error=${encodeURIComponent('An account with this email already exists. Sign in instead.')}`)
  }

  // Supabase returns a session immediately if email confirmation is disabled.
  // If confirmation is enabled, session is null — show the check-your-email screen.
  if (!data.session) {
    return redirect(`/auth/confirm?email=${encodeURIComponent(email)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/setup')
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Superadmin shortcut — no Supabase account needed
  if (
    email === process.env.SUPERADMIN_EMAIL &&
    password === process.env.SUPERADMIN_PASSWORD
  ) {
    cookies().set(SUPERADMIN_COOKIE, getSessionSecret(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SUPERADMIN_COOKIE_MAX_AGE,
      path: '/superadmin',
    })
    redirect('/superadmin')
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const msg = error.message.toLowerCase().includes('email not confirmed')
      ? 'Please confirm your email address before signing in. Check your inbox.'
      : error.message
    return redirect(`/auth/login?error=${encodeURIComponent(msg)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/admin/guests')
}

export async function forgotPassword(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const origin = process.env.NEXT_PUBLIC_APP_URL
    ?? process.env.PAYSTACK_CALLBACK_BASE_URL
    ?? 'https://nemiplanner.xyz'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  })

  if (error) {
    return redirect(`/auth/forgot-password?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/auth/forgot-password?success=1')
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}
