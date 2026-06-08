'use client'

import { useState } from 'react'
import type { GHCommit } from '@/lib/types'
import { saveCommit, getCachedCommit } from '@/lib/idb'

interface CommitFile { filename: string; status: string; additions: number; deletions: number; patch: string | null }
interface CommitDetail { sha: string; message: string; author: string; date: string; files: CommitFile[] }

interface Props {
  commits: GHCommit[]
  repo?: string | null
}

export default function InteractiveCommitsList({ commits, repo }: Props) {
  const [expandedSha, setExpandedSha] = useState<string | null>(null)
  const [commitData, setCommitData] = useState<CommitDetail | null>(null)
  const [commitLoading, setCommitLoading] = useState(false)
  const [fromCache, setFromCache] = useState(false)

  async function loadCommit(sha: string) {
    if (expandedSha === sha) { setExpandedSha(null); setCommitData(null); return }
    if (!repo) return
    setExpandedSha(sha)
    setCommitData(null)
    setCommitLoading(true)

    try {
      const cached = await getCachedCommit(repo, sha)
      if (cached) {
        setCommitData(cached.data as CommitDetail)
        setFromCache(true)
        setCommitLoading(false)
        return
      }
    } catch { /* ignore */ }

    try {
      const res = await fetch(`/api/github/commit?repo=${encodeURIComponent(repo)}&sha=${sha}`)
      const data = await res.json()
      if (res.ok) {
        setCommitData(data)
        setFromCache(false)
        saveCommit(repo, sha, data).catch(() => {})
      } else {
        setCommitData({ sha, message: data.error ?? 'Could not load', author: '', date: '', files: [] })
      }
    } catch {
      setCommitData({ sha, message: 'Network error', author: '', date: '', files: [] })
    }
    setCommitLoading(false)
  }

  if (!commits.length) return null

  return (
    <div>
      <div className="text-[9px] font-mono text-gray-600 uppercase tracking-wider mb-2">
        {commits.length} recent commits · click to view code
      </div>
      {commits.slice(0, 10).map(c => (
        <div key={c.sha}>
          <button
            onClick={() => loadCommit(c.sha)}
            disabled={!repo}
            className="w-full flex items-start gap-2 py-1.5 border-b border-gray-800 last:border-0 hover:bg-gray-800/40 rounded px-1 transition-colors text-left disabled:cursor-default"
          >
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 transition-colors ${
              expandedSha === c.sha ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'
            }`}>{c.sha.slice(0, 7)}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-mono text-gray-300 truncate">{c.commit.message.split('\n')[0]}</div>
              <div className="text-[9px] font-mono text-gray-700 mt-0.5">{c.commit.author.name} · {new Date(c.commit.author.date).toLocaleDateString()}</div>
            </div>
            {repo && (
              <span className={`text-[9px] font-mono flex-shrink-0 ${expandedSha === c.sha ? 'text-emerald-400' : 'text-gray-700'}`}>
                {expandedSha === c.sha ? '▾' : '▸'}
              </span>
            )}
          </button>

          {expandedSha === c.sha && (
            <div className="mt-1 mb-2 ml-2 space-y-1">
              {commitLoading && (
                <div className="text-[10px] font-mono text-gray-600 py-2">loading diff…</div>
              )}
              {!commitLoading && commitData && commitData.files.length === 0 && (
                <div className="text-[10px] font-mono text-gray-600 py-2">{commitData.message}</div>
              )}
              {!commitLoading && commitData && commitData.files.length > 0 && (
                <>
                  {fromCache && (
                    <span className="text-[8px] font-mono text-gray-700 bg-gray-800 px-1 py-0.5 rounded">offline — cached</span>
                  )}
                  {commitData.files.map(f => (
                    <div key={f.filename} className="bg-gray-800 rounded-lg p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-mono px-1 py-0.5 rounded flex-shrink-0 ${
                          f.status === 'added' ? 'bg-emerald-900/40 text-emerald-400' :
                          f.status === 'removed' ? 'bg-red-900/40 text-red-400' :
                          'bg-amber-900/40 text-amber-400'
                        }`}>{f.status}</span>
                        <span className="text-[10px] font-mono text-gray-300 truncate flex-1">{f.filename}</span>
                        <span className="text-[9px] font-mono text-emerald-500 flex-shrink-0">+{f.additions}</span>
                        <span className="text-[9px] font-mono text-red-400 flex-shrink-0">-{f.deletions}</span>
                      </div>
                      {f.patch && (
                        <pre className="text-[9px] font-mono text-gray-500 overflow-x-auto max-h-40 whitespace-pre-wrap break-all leading-4">
                          {f.patch.slice(0, 1200)}{f.patch.length > 1200 ? '\n…' : ''}
                        </pre>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
