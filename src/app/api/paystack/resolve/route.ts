import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const account_number = req.nextUrl.searchParams.get('account_number')
  const bank_code = req.nextUrl.searchParams.get('bank_code')

  if (!account_number || !bank_code) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const res = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  )
  const json = await res.json()

  if (!json.status) {
    return NextResponse.json({ error: json.message ?? 'Could not verify account' }, { status: 422 })
  }

  return NextResponse.json({ account_name: json.data.account_name as string })
}
