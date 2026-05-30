import { createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

const API_URL = process.env.API_URL ?? 'http://localhost:8000'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params
  const supabase = await createServerSupabaseClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))

  const response = await fetch(`${API_URL}/sync/${owner}/${repo}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'x-github-token': session.provider_token ?? '',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Sync failed' }))
    return NextResponse.json(error, { status: response.status })
  }

  return NextResponse.json(await response.json())
}
