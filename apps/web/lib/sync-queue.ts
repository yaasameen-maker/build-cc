export type MutationType = 'push_branch' | 'create_pr' | 'update_pr'

export type SyncQueueItem = {
  id?: string
  repoFullName: string
  mutationType: MutationType
  payload: Record<string, unknown>
  status?: 'queued' | 'processing' | 'failed' | 'done'
  retryCount?: number
}

export async function enqueueSyncItem(item: SyncQueueItem): Promise<{ id: string; status: string }> {
  const res = await fetch('/api/sync/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  if (!res.ok) throw new Error('Failed to enqueue sync item')
  return res.json()
}
