import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await sql`
    update sync_queue
    set status = 'queued', updated_at = now()
    where user_id = ${session.user.id}
      and status = 'failed'
      and retry_count < 5
  `

  return NextResponse.json({ ok: true })
}
