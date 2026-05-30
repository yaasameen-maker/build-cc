import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const API_URL = process.env.API_URL ?? 'http://localhost:8000'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Retrieve the GitHub OAuth token from the session token cookie
  // NextAuth stores provider tokens in the account table — fetch it
  const body = await request.json().catch(() => ({}))

  // The GitHub token is available as session.user.githubToken if we expose it
  // For now we pass it from the client via the request body
  const { githubToken } = body

  if (!githubToken) {
    return NextResponse.json({ error: 'GitHub token required' }, { status: 400 })
  }

  const response = await fetch(`${API_URL}/sync/${owner}/${repo}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-github-token': githubToken,
    },
    body: JSON.stringify({ branch: body.branch }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Sync failed' }))
    return NextResponse.json(error, { status: response.status })
  }

  return NextResponse.json(await response.json())
}
