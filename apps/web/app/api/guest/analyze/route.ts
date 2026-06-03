import { NextRequest, NextResponse } from 'next/server'

const rawApiUrl = process.env.API_URL ?? ''
const API_URL = rawApiUrl && !rawApiUrl.startsWith('http')
  ? `https://${rawApiUrl}`
  : rawApiUrl || 'http://localhost:8000'

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('repo') ?? ''
  const match = raw.match(/(?:github\.com\/)?([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#]|$)/)
  if (!match) {
    return NextResponse.json({ error: 'Paste a valid GitHub repo URL or owner/repo slug' }, { status: 400 })
  }
  const [, owner, repo] = match

  const res = await fetch(`${API_URL}/sync/${owner}/${repo}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = body.detail ?? 'Repo not found or is private'
    return NextResponse.json({ error: msg }, { status: res.status })
  }

  return NextResponse.json(await res.json())
}
