import { createServerSupabaseClient } from '@/lib/supabase'
import { notFound, redirect } from 'next/navigation'
import BuildDetail from './BuildDetail'

export default async function BuildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')

  const { data: build } = await supabase.from('builds').select('*').eq('id', id).single()
  if (!build) notFound()

  return <BuildDetail build={build as never} />
}
