import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiUrl = process.env.API_URL
  if (!apiUrl) return NextResponse.json({ error: 'API_URL not configured' }, { status: 500 })

  const body = await req.json()

  const res = await fetch(`${apiUrl}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, user_id: String(session.user.id) }),
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
