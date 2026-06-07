'use client'

import { useState } from 'react'
import { features } from '@/lib/features'

interface Finding {
  severity: string
  category: string
  title: string
  body: string
  file_path?: string | null
  line_number?: number | null
}

interface ReviewResult {
  run_id: string
  request_id: string
  findings: number
}

const SEVERITY_COLORS: Record<string, string> = {
  high: 'text-red-400 border-red-900/40 bg-red-900/10',
  medium: 'text-amber-400 border-amber-900/40 bg-amber-900/10',
  low: 'text-blue-400 border-blue-900/40 bg-blue-900/10',
  warning: 'text-yellow-400 border-yellow-900/40 bg-yellow-900/10',
}

type Props = { repo: string; userId: string }

export default function AgentReviewPanel({ repo, userId }: Props) {
  const [running, setRunning] = useState(false)
  const [findings, setFindings] = useState<Finding[]>([])
  const [runId, setRunId] = useState<string | null>(null)
  const [error, setError] = useState('')

  if (!features.eccReviews) return null

  async function runReview() {
    setRunning(true)
    setFindings([])
    setError('')
    setRunId(null)

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          repo_full_name: repo,
          agent_name: 'code-reviewer',
          prompt: `Review the repository ${repo}. Focus on code quality, security issues, and best practices.`,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError((err as { error?: string }).error ?? `Error ${res.status}`)
        return
      }

      const result: ReviewResult & { findings_list?: Finding[] } = await res.json()
      setRunId(result.run_id)
      if (Array.isArray(result.findings_list)) {
        setFindings(result.findings_list)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Review failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="mt-4 bg-gray-900/40 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[11px] font-mono font-semibold text-gray-300">AI code review</div>
          {runId && <div className="text-[9px] font-mono text-gray-700 mt-0.5">run {runId.slice(0, 8)}</div>}
        </div>
        <button
          onClick={runReview}
          disabled={running}
          className="text-[10px] font-mono px-3 py-1.5 rounded border border-emerald-700 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {running ? 'reviewing…' : '✦ run review'}
        </button>
      </div>

      {error && (
        <div className="text-[10px] font-mono text-red-400 mb-2">{error}</div>
      )}

      {findings.length > 0 && (
        <div className="space-y-2">
          {findings.map((f, i) => (
            <div key={i} className={`rounded-lg border px-3 py-2 text-[11px] ${SEVERITY_COLORS[f.severity] ?? 'text-gray-400 border-gray-800'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[9px] uppercase">{f.severity}</span>
                <span className="font-mono text-[9px] text-gray-600">{f.category}</span>
                {f.file_path && (
                  <span className="font-mono text-[9px] text-gray-600 truncate">
                    {f.file_path}{f.line_number ? `:${f.line_number}` : ''}
                  </span>
                )}
              </div>
              <div className="font-semibold text-[11px] mb-0.5">{f.title}</div>
              <div className="text-[10px] text-gray-400 leading-relaxed">{f.body}</div>
            </div>
          ))}
        </div>
      )}

      {!running && runId && findings.length === 0 && (
        <div className="text-[10px] font-mono text-gray-600">No findings — review complete.</div>
      )}
    </div>
  )
}
