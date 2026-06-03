import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const repo = req.nextUrl.searchParams.get('repo')
  const pr = req.nextUrl.searchParams.get('pr')
  if (!repo || !pr) return NextResponse.json({ error: 'repo and pr required' }, { status: 400 })
  const [owner, repoName] = repo.split('/')
  if (!owner || !repoName) return NextResponse.json({ error: 'Invalid repo' }, { status: 400 })

  const [account] = await sql`
    SELECT access_token FROM accounts
    WHERE "userId" = ${session.user.id} AND provider = 'github'`

  const token = account?.access_token ?? ''
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/pulls/${pr}/files?per_page=100`,
    { headers }
  )
  if (!res.ok) return NextResponse.json([], { status: 200 })

  const files = await res.json()
  return NextResponse.json(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    files.map((f: any) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch ?? null,
    }))
  )
}
