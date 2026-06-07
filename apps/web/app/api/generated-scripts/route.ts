import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const repo = searchParams.get('repo') ?? ''

  const rows = await sql`
    select id, language_id, prompt, mode, filename_suggestion, content, created_at
    from generated_scripts
    where user_id = ${String(session.user.id)}
      ${repo ? sql`and repo_full_name = ${repo}` : sql``}
    order by created_at desc
    limit 20
  `

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { repoFullName, languageId, prompt, stackContext, mode, filenameSuggestion, content } = body

  if (!languageId || !prompt || !content || !mode) {
    return NextResponse.json({ error: 'languageId, prompt, mode, and content are required' }, { status: 400 })
  }

  const [row] = await sql`
    insert into generated_scripts
      (user_id, repo_full_name, language_id, prompt, stack_context, mode, filename_suggestion, content)
    values
      (${String(session.user.id)}, ${repoFullName ?? null}, ${languageId},
       ${prompt}, ${JSON.stringify(stackContext ?? {})}::jsonb, ${mode},
       ${filenameSuggestion ?? null}, ${content})
    returning id, created_at
  `

  return NextResponse.json(row)
}
