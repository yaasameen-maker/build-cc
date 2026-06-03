'use client'

import { useState } from 'react'

interface Finding {
  filename: string
  line: number
  severity: 'error' | 'warning' | 'info'
  category: string
  message: string
  snippet: string
}

interface Summary {
  total: number
  errors: number
  warnings: number
  info: number
  score: number
  categories: Record<string, number>
}

interface ScanResult {
  findings: Finding[]
  summary: Summary
  files_scanned: number
}

interface Props {
  repo: string
  onScanComplete?: (result: ScanResult) => void
}

const SEV_STYLES = {
  error: 'bg-red-900/30 text-red-400 border-red-800/50',
  warning: 'bg-amber-900/30 text-amber-400 border-amber-800/50',
  info: 'bg-blue-900/30 text-blue-400 border-blue-800/50',
}

const SEV_DOT = {
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
}

export default function CodeScanResults({ repo }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all')

  const [owner, repoName] = repo.split('/')

  async function runScan() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo: repoName }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? data.detail ?? 'Scan failed'); return }
      setResult(data)
    } catch {
      setError('Could not reach the server')
    } finally {
      setLoading(false)
    }
  }

  const visible = result
    ? filter === 'all' ? result.findings : result.findings.filter(f => f.severity === filter)
    : []

  const scoreColor = !result ? 'text-gray-400' :
    result.summary.score >= 80 ? 'text-emerald-400' :
    result.summary.score >= 50 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[9px] font-mono text-gray-600 uppercase tracking-wider">code scan</div>
        <button
          onClick={runScan}
          disabled={loading}
          className="text-[10px] font-mono px-2.5 py-1 rounded border border-violet-700 text-violet-400 hover:bg-violet-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'scanning…' : '⚡ run scan'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-3">
          <div className="h-1 flex-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full animate-pulse w-1/2" />
          </div>
          <span className="text-[10px] font-mono text-gray-600">reading files…</span>
        </div>
      )}

      {error && <p className="text-xs font-mono text-red-400 py-2">{error}</p>}

      {result && (
        <>
          {/* Summary row */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div className="text-center">
              <div className={`text-lg font-bold font-mono ${scoreColor}`}>{result.summary.score}</div>
              <div className="text-[9px] font-mono text-gray-600">score</div>
            </div>
            <div className="flex-1 h-px bg-gray-800" />
            <div className="flex gap-2 text-[10px] font-mono">
              <span className="text-red-400">{result.summary.errors}e</span>
              <span className="text-amber-400">{result.summary.warnings}w</span>
              <span className="text-blue-400">{result.summary.info}i</span>
              <span className="text-gray-600">·</span>
              <span className="text-gray-500">{result.files_scanned} files</span>
            </div>
          </div>

          {/* Filter tabs */}
          {result.findings.length > 0 && (
            <div className="flex gap-1 mb-3">
              {(['all', 'error', 'warning', 'info'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded transition-colors ${
                    filter === f
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-600 hover:text-gray-400'
                  }`}
                >
                  {f === 'all' ? `all (${result.findings.length})` : f}
                </button>
              ))}
            </div>
          )}

          {/* Findings */}
          {result.findings.length === 0 && (
            <div className="text-center py-4 text-emerald-400 text-xs font-mono">
              No issues found
            </div>
          )}

          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {visible.map((f, i) => (
              <div key={i} className={`rounded-lg px-3 py-2 border ${SEV_STYLES[f.severity]}`}>
                <div className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${SEV_DOT[f.severity]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-gray-400 truncate">{f.filename}</span>
                      <span className="text-[9px] font-mono text-gray-600">:{f.line}</span>
                      <span className="text-[9px] font-mono px-1 rounded bg-gray-800 text-gray-500">{f.category}</span>
                    </div>
                    <div className="text-[11px] font-mono mt-0.5">{f.message}</div>
                    {f.snippet && (
                      <div className="text-[9px] font-mono text-gray-600 mt-0.5 truncate">{f.snippet}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!result && !loading && (
        <p className="text-[10px] font-mono text-gray-700 py-2">
          Scans up to 20 source files for secrets, debug statements, and code smells.
        </p>
      )}
    </div>
  )
}
