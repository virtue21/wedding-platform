import { NextResponse } from 'next/server'

export const revalidate = 3600 // cache bank list for 1 hour

export async function GET() {
  const res = await fetch('https://api.paystack.co/bank?currency=NGN&perPage=100', {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    next: { revalidate: 3600 },
  })
  const json = await res.json()
  if (!json.status) return NextResponse.json({ banks: [] })
  // Return just id, name, code
  const banks = (json.data as { id: number; name: string; code: string }[]).map(b => ({
    id: b.id,
    name: b.name,
    code: b.code,
  }))
  return NextResponse.json({ banks })
}
