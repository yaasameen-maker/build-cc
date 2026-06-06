import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'

async function processCreatePR(
  payload: Record<string, unknown>,
  accessToken: string
): Promise<void> {
  const { repo, title, body, head, base } = payload as {
    repo: string
    title: string
    body?: string
    head: string
    base: string
  }

  const [owner, repoName] = (repo as string).split('/')

  // Check for existing open PR on this branch to avoid duplicates
  const dupeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/pulls?head=${owner}:${encodeURIComponent(head)}&state=open`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
      },
    }
  )

  if (dupeRes.ok) {
    const existing = await dupeRes.json()
    if (Array.isArray(existing) && existing.length > 0) return
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/pulls`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, body: body ?? '', head, base }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? `GitHub error ${res.status}`)
  }
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [account] = await sql`
    select access_token from accounts
    where "userId" = ${session.user.id} and provider = 'github'
    order by id desc limit 1
  `

  if (!account?.access_token) {
    return NextResponse.json({ error: 'GitHub token not found' }, { status: 400 })
  }

  const rows = await sql`
    select id, mutation_type, payload
    from sync_queue
    where user_id = ${session.user.id}
      and status = 'queued'
    order by created_at asc
    limit 10
  `

  let processed = 0
  let failed = 0

  for (const row of rows) {
    try {
      await sql`
        update sync_queue set status = 'processing', updated_at = now()
        where id = ${row.id}
      `

      if (row.mutation_type === 'create_pr') {
        await processCreatePR(row.payload as Record<string, unknown>, account.access_token as string)
      }

      await sql`
        update sync_queue set status = 'done', updated_at = now(), last_error = null
        where id = ${row.id}
      `
      processed++
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      await sql`
        update sync_queue
        set status = 'failed',
            retry_count = retry_count + 1,
            last_error = ${message},
            updated_at = now()
        where id = ${row.id}
      `
      failed++
    }
  }

  return NextResponse.json({ processed, failed })
}
