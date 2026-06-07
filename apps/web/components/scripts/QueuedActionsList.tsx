'use client'

import { useEffect, useState } from 'react'

type QueueItem = {
  id: string
  mutation_type: string
  status: 'queued' | 'processing' | 'failed' | 'done'
  retry_count: number
  last_error: string | null
  created_at: string
  updated_at: string
}

const STATUS_COLORS: Record<QueueItem['status'], string> = {
  queued: 'text-amber-400',
  processing: 'text-blue-400 animate-pulse',
  failed: 'text-red-400',
  done: 'text-emerald-400',
}

type Props = { repoFullName: string }

export function QueuedActionsList({ repoFullName }: Props) {
  const [items, setItems] = useState<QueueItem[]>([])
  const [retrying, setRetrying] = useState(false)

  async function load() {
    const res = await fetch(`/api/sync/queue?repo=${encodeURIComponent(repoFullName)}`)
    if (res.ok) setItems(await res.json())
  }

  useEffect(() => { load() }, [repoFullName])

  async function retryFailed() {
    setRetrying(true)
    await fetch('/api/sync/retry', { method: 'POST' })
    await load()
    setRetrying(false)
  }

  const active = items.filter(i => i.status !== 'done')
  if (active.length === 0) return null

  const hasFailed = active.some(i => i.status === 'failed')

  return (
    <div className="mt-4 space-y-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] font-mono text-gray-600 uppercase tracking-wider">queued actions</span>
        {hasFailed && (
          <button
            onClick={retryFailed}
            disabled={retrying}
            className="text-[9px] font-mono px-2 py-0.5 rounded border border-amber-700 text-amber-400 hover:bg-amber-500/10 disabled:opacity-40 transition-colors"
          >
            {retrying ? 'retrying…' : '↺ retry failed'}
          </button>
        )}
      </div>
      {active.map(item => (
        <div key={item.id} className="flex items-start gap-2 px-2 py-1.5 rounded border border-gray-800 bg-gray-900/30">
          <span className={`text-[9px] font-mono flex-shrink-0 mt-0.5 ${STATUS_COLORS[item.status]}`}>
            {item.status}
          </span>
          <span className="text-[10px] font-mono text-gray-400 flex-1 truncate">
            {item.mutation_type.replace(/_/g, ' ')}
          </span>
          {item.retry_count > 0 && (
            <span className="text-[9px] font-mono text-gray-700 flex-shrink-0">
              ×{item.retry_count}
            </span>
          )}
          {item.last_error && (
            <span className="text-[9px] font-mono text-red-500 truncate max-w-[120px]" title={item.last_error}>
              {item.last_error.slice(0, 40)}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
