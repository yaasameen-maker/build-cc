import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const repo = req.nextUrl.searchParams.get('repo')
  if (!repo) return NextResponse.json({ error: 'repo required' }, { status: 400 })
  const [owner, repoName] = repo.split('/')
  if (!owner || !repoName) return NextResponse.json({ error: 'Invalid repo' }, { status: 400 })

  const [account] = await sql`
    SELECT access_token FROM accounts
    WHERE "userId" = ${session.user.id} AND provider = 'github'`

  const token = account?.access_token ?? ''
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/branches?per_page=100`,
    { headers }
  )
  if (!res.ok) return NextResponse.json([], { status: 200 })

  const branches = await res.json()
  return NextResponse.json(branches.map((b: { name: string }) => b.name))
}
