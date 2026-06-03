import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const repo = req.nextUrl.searchParams.get('repo')
  const path = req.nextUrl.searchParams.get('path')
  if (!repo || !path) return NextResponse.json({ error: 'repo and path required' }, { status: 400 })
  const [owner, repoName] = repo.split('/')
  if (!owner || !repoName) return NextResponse.json({ error: 'Invalid repo' }, { status: 400 })

  const [account] = await sql`
    SELECT access_token FROM accounts
    WHERE "userId" = ${session.user.id} AND provider = 'github'`

  const token = account?.access_token ?? ''
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(
    `https://raw.githubusercontent.com/${owner}/${repoName}/HEAD/${path}`,
    { headers }
  )

  if (!res.ok) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  const content = await res.text()
  return NextResponse.json({ content: content.slice(0, 100_000), path, repo })
}
