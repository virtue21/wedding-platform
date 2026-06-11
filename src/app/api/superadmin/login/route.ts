import { NextRequest, NextResponse } from 'next/server'
import { SUPERADMIN_COOKIE, SUPERADMIN_COOKIE_MAX_AGE, getSessionSecret } from '@/lib/superadmin-session'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const expectedEmail = process.env.SUPERADMIN_EMAIL
  const expectedPassword = process.env.SUPERADMIN_PASSWORD

  if (!expectedEmail || !expectedPassword) {
    return NextResponse.json({ error: 'Superadmin not configured' }, { status: 500 })
  }

  if (email !== expectedEmail || password !== expectedPassword) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SUPERADMIN_COOKIE, getSessionSecret(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SUPERADMIN_COOKIE_MAX_AGE,
    path: '/superadmin',
  })
  return res
}
