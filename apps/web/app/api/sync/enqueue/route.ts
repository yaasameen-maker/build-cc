import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { repoFullName, mutationType, payload } = body

  if (!repoFullName || !mutationType || !payload) {
    return NextResponse.json({ error: 'repoFullName, mutationType, and payload are required' }, { status: 400 })
  }

  const [row] = await sql`
    insert into sync_queue (user_id, repo_full_name, mutation_type, payload)
    values (${session.user.id}, ${repoFullName}, ${mutationType}, ${JSON.stringify(payload)}::jsonb)
    returning id, status
  `

  return NextResponse.json(row)
}
