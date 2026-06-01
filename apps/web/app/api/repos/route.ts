import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [account] = await sql`
    SELECT access_token FROM accounts
    WHERE "userId" = ${session.user.id} AND provider = 'github'`

  if (!account?.access_token) return NextResponse.json([], { status: 200 })

  const res = await fetch(
    'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator',
    { headers: { Authorization: `Bearer ${account.access_token}`, Accept: 'application/vnd.github+json' } }
  )

  if (!res.ok) return NextResponse.json([], { status: 200 })

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
