import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import sql from '@/lib/db'
import BuildsClient from './BuildsClient'
import type { Build } from '@/lib/types'

export default async function BuildsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const builds = await sql`
    SELECT * FROM builds WHERE user_id = ${session.user.id} ORDER BY updated_at DESC
  ` as unknown as Build[]

  return (
    <BuildsClient
      initialBuilds={builds}
      user={{ id: session.user.id, name: session.user.name ?? '', image: session.user.image ?? '' }}
    />
  )
}
