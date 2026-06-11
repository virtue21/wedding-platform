import { NextResponse } from 'next/server'
import { SUPERADMIN_COOKIE } from '@/lib/superadmin-session'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SUPERADMIN_COOKIE, '', { maxAge: 0, path: '/superadmin' })
  return res
}
