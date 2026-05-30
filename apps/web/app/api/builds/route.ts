import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'
import { EMPTY_DEP } from '@/lib/types'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, repo } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const [build] = await sql`
    INSERT INTO builds (user_id, name, repo, checks, auto_checks, custom_items, docs, section_open, gh_data, signals, dep)
    VALUES (
      ${session.user.id}, ${name.trim()}, ${repo?.trim() || null},
      '{}', '{}', '{}', '[]', '{}', '{}', '{}', ${JSON.stringify(EMPTY_DEP)}
    )
    RETURNING *
  ` as unknown as object[]

  return NextResponse.json(build)
}
