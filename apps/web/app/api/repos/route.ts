import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ORDER BY id DESC so we always use the most recently upserted account row
  const [account] = await sql`
    SELECT access_token, scope FROM accounts
    WHERE "userId" = ${session.user.id} AND provider = 'github'
    ORDER BY id DESC LIMIT 1`

  if (!account?.access_token) {
    return NextResponse.json({ error: 'GitHub token not found — sign out and sign back in' }, { status: 400 })
  }

  // Parse scopes. If scope is null/empty, default to FULL access — the token
  // may have repo scope even if the column wasn't stored correctly.
  const scopes = (account.scope ?? '').split(/[\s,]+/).filter(Boolean)
  const hasFullRepoScope = scopes.length === 0 || scopes.includes('repo')
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return NextResponse.json(repos.map((r: any) => ({
    full_name: r.full_name,
    name: r.name,
    private: r.private,
    description: r.description,
    updated_at: r.updated_at,
  })))
}
