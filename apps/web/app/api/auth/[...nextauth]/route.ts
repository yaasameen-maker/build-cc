import { handlers } from '@/lib/auth'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    return await handlers.GET(req)
  } catch (e) {
    console.error('[auth] GET error:', e)
    throw e
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handlers.POST(req)
  } catch (e) {
    console.error('[auth] POST error:', e)
    throw e
  }
}
