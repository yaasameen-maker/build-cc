import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Build a safe partial update — only allow known columns
  const allowed = ['name', 'checks', 'auto_checks', 'custom_items', 'docs', 'section_open', 'gh_data', 'signals', 'dep', 'last_scan'] as const
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k as typeof allowed[number])))

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  // Build SET clause dynamically
  const entries = Object.entries(updates).filter((e): e is [string, NonNullable<typeof e[1]>] => e[1] !== undefined)
  const setClauses = entries.map(([col], i) => `${col} = $${i + 1}`).join(', ')
  const values = entries.map(([, v]) => typeof v === 'object' ? JSON.stringify(v) : v)

  await sql.unsafe(
    `UPDATE builds SET ${setClauses}, updated_at = now() WHERE id = $${entries.length + 1} AND user_id = $${entries.length + 2}`,
    [...values, id, session.user.id] as (string | number | boolean | object | null)[]
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await sql`DELETE FROM builds WHERE id = ${id} AND user_id = ${session.user.id}`

  return NextResponse.json({ ok: true })
}
