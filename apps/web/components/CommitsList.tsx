'use client'

import type { GHCommit } from '@/lib/types'

export default function CommitsList({ commits }: { commits: GHCommit[] }) {
  if (!commits.length) return null
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
      <div className="text-[9px] font-mono text-gray-600 uppercase tracking-wider mb-2">recent commits</div>
      {commits.slice(0, 10).map(c => (
        <div key={c.sha} className="flex items-center gap-2 py-1.5 border-b border-gray-800 last:border-0">
          <span className="text-[9px] font-mono text-gray-600 flex-shrink-0">{c.sha.slice(0, 7)}</span>
          <span className="text-[11px] font-mono text-gray-300 truncate flex-1">
            {c.commit.message.split('\n')[0].slice(0, 72)}
          </span>
          <span className="text-[9px] font-mono text-gray-700 flex-shrink-0">{c.commit.author.name}</span>
        </div>
      ))}
    </div>
  )
}
