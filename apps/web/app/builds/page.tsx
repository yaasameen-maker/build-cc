import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import BuildsClient from './BuildsClient'
import type { Build } from '@/lib/types'

export default async function BuildsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const [builds, accountRow] = await Promise.all([
    sql`SELECT * FROM builds WHERE user_id = ${session.user.id} ORDER BY updated_at DESC`,
    sql`SELECT scope FROM accounts WHERE "userId" = ${session.user.id} AND provider = 'github' LIMIT 1`,
  ])

  const rawScope: string = (accountRow[0]?.scope ?? '')
  const scopes = rawScope.split(/[\s,]+/).filter(Boolean)
  const repoScope: 'repo' | 'public_repo' = scopes.includes('repo') ? 'repo' : 'public_repo'

  return (
    <BuildsClient
      initialBuilds={builds as unknown as Build[]}
      user={{ id: session.user.id, name: session.user.name ?? '', image: session.user.image ?? '' }}
      repoScope={repoScope}
    />
  )
}
