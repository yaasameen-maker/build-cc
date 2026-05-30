import { auth } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import sql from '@/lib/db'
import BuildDetail from './BuildDetail'
import type { Build } from '@/lib/types'

export default async function BuildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/signin')

  const [build] = await sql`
    SELECT * FROM builds WHERE id = ${id} AND user_id = ${session.user.id}
  ` as unknown as Build[]

  if (!build) notFound()

  return <BuildDetail build={build} />
}
