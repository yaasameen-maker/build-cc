import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [account] = await sql`
    SELECT access_token, scope FROM accounts
    WHERE "userId" = ${session.user.id} AND provider = 'github'`

  if (!account?.access_token) {
    return NextResponse.json({ error: 'GitHub token not found — reconnect your account' }, { status: 400 })
  }

  // Adjust affiliation based on the granted OAuth scope.
  // public_repo scope can only list owned public repos — collaborator affiliation requires repo scope.
  const grantedScope: string = account.scope ?? ''
  const hasFullRepoScope = grantedScope.includes('repo') && !grantedScope.startsWith('public_repo')
  const params = hasFullRepoScope
    ? 'per_page=100&sort=updated&affiliation=owner,collaborator'
    : 'per_page=100&sort=updated&affiliation=owner&visibility=public'

  const res = await fetch(
    `https://api.github.com/user/repos?${params}`,
    { headers: { Authorization: `Bearer ${account.access_token}`, Accept: 'application/vnd.github+json' } }
  )

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = body.message ?? `GitHub API error ${res.status}`
    return NextResponse.json({ error: msg }, { status: res.status })
  }

  const repos = await res.json()
  return NextResponse.json(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    repos.map((r: any) => ({
      full_name: r.full_name,
      name: r.name,
      private: r.private,
      description: r.description,
      updated_at: r.updated_at,
    }))
  )
}
