import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'

const API_URL = process.env.API_URL ?? 'http://localhost:8000'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [account] = await sql`
    SELECT access_token FROM accounts
    WHERE "userId" = ${session.user.id} AND provider = 'github'`

  if (!account?.access_token) {
    return NextResponse.json({ error: 'GitHub token not found — reconnect your GitHub account' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))

  const response = await fetch(`${API_URL}/sync/${owner}/${repo}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-github-token': account.access_token,
    },
    body: JSON.stringify({ branch: body.branch }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Sync failed' }))
    return NextResponse.json(error, { status: response.status })
  }

  return NextResponse.json(await response.json())
}
