import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import BuildsClient from './BuildsClient'

export default async function BuildsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: builds } = await supabase
    .from('builds')
    .select('*')
    .order('updated_at', { ascending: false })

  return <BuildsClient initialBuilds={builds ?? []} user={user} />
}
