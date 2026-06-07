import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const repo = searchParams.get('repo') ?? ''

  const rows = await sql`
    select id, mutation_type, status, retry_count, last_error, created_at, updated_at
    from sync_queue
    where user_id = ${session.user.id}
      ${repo ? sql`and repo_full_name = ${repo}` : sql``}
    order by created_at desc
    limit 30
  `

  return NextResponse.json(rows)
}
