import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [account] = await sql`
    SELECT access_token, scope FROM accounts
    WHERE "userId" = ${session.user.id} AND provider = 'github'`

  if (!account?.access_token) {
    return NextResponse.json({ error: 'GitHub token not found' }, { status: 400 })
  }

  const scope: string = account.scope ?? ''
  if (!scope.includes('repo') && !scope.includes('public_repo')) {
    return NextResponse.json({ error: 'Token lacks repo write scope' }, { status: 403 })
  }

  const body = await req.json()
  const { repo, title, body: prBody, head, base } = body

  if (!repo || !title || !head || !base) {
    return NextResponse.json({ error: 'repo, title, head, and base are required' }, { status: 400 })
  }

  const [owner, repoName] = (repo as string).split('/')
  if (!owner || !repoName) {
    return NextResponse.json({ error: 'Invalid repo format' }, { status: 400 })
  }

  const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body: prBody ?? '', head, base }),
  })

  const data = await ghRes.json()
  if (!ghRes.ok) {
    return NextResponse.json({ error: data.message ?? 'Failed to create PR' }, { status: ghRes.status })
  }

  return NextResponse.json({ number: data.number, url: data.html_url, title: data.title })
}
