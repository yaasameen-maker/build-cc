import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const PR_AGENT_BOT = 'github-actions[bot]'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const repo = req.nextUrl.searchParams.get('repo')
  const pr = req.nextUrl.searchParams.get('pr')
  const botUser = req.nextUrl.searchParams.get('bot') ?? PR_AGENT_BOT
  const serverUrl = req.nextUrl.searchParams.get('serverUrl')

  if (!repo || !pr) return NextResponse.json({ error: 'repo and pr required' }, { status: 400 })
  const [owner, repoName] = repo.split('/')
  if (!owner || !repoName) return NextResponse.json({ error: 'Invalid repo' }, { status: 400 })

  const [account] = await sql`
    SELECT access_token FROM accounts
    WHERE "userId" = ${session.user.id} AND provider = 'github'`

  // Self-hosted PR Agent mode
  if (serverUrl) {
    try {
      const res = await fetch(`${serverUrl}/api/v1/repos/${owner}/${repoName}/pulls/${pr}/review`, {
        headers: { Accept: 'application/json' },
      })
      if (res.ok) return NextResponse.json(await res.json())
    } catch {
      return NextResponse.json({ error: 'Could not reach self-hosted PR Agent server' }, { status: 502 })
    }
  }

  // GitHub Action bot mode — read reviews and comments posted by the bot
  const token = account?.access_token ?? ''
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const [reviewsRes, commentsRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls/${pr}/reviews?per_page=100`, { headers }),
    fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls/${pr}/comments?per_page=100`, { headers }),
  ])

  const allReviews = reviewsRes.ok ? await reviewsRes.json() : []
  const allComments = commentsRes.ok ? await commentsRes.json() : []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const botReviews = allReviews.filter((r: any) => r.user?.login === botUser)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const botComments = allComments.filter((c: any) => c.user?.login === botUser)

  return NextResponse.json({
    bot: botUser,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reviews: botReviews.map((r: any) => ({
      id: r.id,
      state: r.state,
      body: r.body,
      submitted_at: r.submitted_at,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comments: botComments.map((c: any) => ({
      id: c.id,
      path: c.path,
      line: c.line ?? c.original_line,
      body: c.body,
      created_at: c.created_at,
    })),
  })
}
