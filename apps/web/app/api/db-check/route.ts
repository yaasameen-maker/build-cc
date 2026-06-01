import sql from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.DATABASE_URL ?? '(not set)'
  let host = '(parse failed)'
  try { host = new URL(url).host } catch {}

  try {
    await sql`SELECT 1`
    console.log('[db-check] connected ok, host:', host)
    return NextResponse.json({ ok: true, host })
  } catch (e: any) {
    console.error('[db-check] FAILED host:', host, 'error:', e?.message, 'code:', e?.code)
    return NextResponse.json({ ok: false, host, error: e?.message, code: e?.code }, { status: 500 })
  }
}
