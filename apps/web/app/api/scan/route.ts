import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const rawApiUrl = process.env.API_URL ?? ''
const API_URL = rawApiUrl && !rawApiUrl.startsWith('http')
  ? `https://${rawApiUrl}`
  : rawApiUrl || 'http://localhost:8000'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [account] = await sql`
    SELECT access_token FROM accounts
    WHERE "userId" = ${session.user.id} AND provider = 'github'`

  const body = await req.json().catch(() => ({}))
  const { owner, repo, files } = body

  if (!owner || !repo) return NextResponse.json({ error: 'owner and repo required' }, { status: 400 })

  const res = await fetch(`${API_URL}/scan/${owner}/${repo}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(account?.access_token ? { 'x-github-token': account.access_token } : {}),
    },
    body: JSON.stringify({ files: files ?? [] }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Scan failed' }))
    return NextResponse.json(err, { status: res.status })
  }

  return NextResponse.json(await res.json())
}
