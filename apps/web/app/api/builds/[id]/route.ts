import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const allowed = ['name', 'checks', 'auto_checks', 'custom_items', 'docs', 'section_open', 'gh_data', 'signals', 'dep', 'last_scan'] as const
  const colMap: Record<string, unknown> = {}
  for (const col of allowed) {
    if (col in body && body[col] !== undefined) colMap[col] = body[col]
  }

  if (Object.keys(colMap).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  await sql`
    UPDATE builds
    SET ${sql(colMap)}, updated_at = now()
    WHERE id = ${id} AND user_id = ${session.user.id}
  `

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await sql`DELETE FROM builds WHERE id = ${id} AND user_id = ${session.user.id}`

  return NextResponse.json({ ok: true })
}
