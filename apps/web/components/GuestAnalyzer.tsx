'use client'

import { useState } from 'react'
import type { SignalMap, GHData } from '@/lib/types'
import StackBadges from './StackBadges'

interface Result {
  signals: SignalMap
  gh_data: GHData
  file_count: number
}

const SIGNAL_LABELS: Record<string, string> = {
  has_cicd: 'CI / CD',
  has_docker: 'Docker',
  has_dockerfile: 'Dockerfile',
  has_db_schema: 'DB schema',
  has_migrations: 'migrations/',
  has_e2e: 'E2E tests',
  has_unit_tests: 'unit tests',
  has_deploy_config: 'deploy config',
  has_pwa: 'PWA',
  has_openapi: 'OpenAPI',
  has_auth_file: 'auth module',
  has_cors: 'CORS',
  has_health: 'health check',
  has_monorepo: 'monorepo',
  has_readme: 'README',
  has_license: 'LICENSE',
  has_env_example: '.env.example',
  has_otel: 'Observability',
  has_evals: 'evals',
  has_mcp: 'MCP',
  has_tools: 'AI tools',
  has_prompts: 'prompts',
  has_vector_db: 'vector DB',
  has_security_scan: 'security scan',
}

export default function GuestAnalyzer() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [analyzedRepo, setAnalyzedRepo] = useState('')

  async function analyze() {
    const val = input.trim()
    if (!val) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`/api/guest/analyze?repo=${encodeURIComponent(val)}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Analysis failed')
      } else {
        setResult(data)
        setAnalyzedRepo(val)
      }
    } catch {
      setError('Could not reach the server — try again shortly')
    } finally {
      setLoading(false)
    }
  }

  const detectedCount = result ? Object.values(result.signals).filter(Boolean).length : 0

  return (
    <div className="w-full max-w-xl">
      {/* Input bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs font-mono text-gray-500 mb-3">
          Try it — paste any public GitHub repo URL
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && analyze()}
            placeholder="github.com/vercel/next.js"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors min-w-0"
          />
          <button
            onClick={analyze}
            disabled={loading || !input.trim()}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-semibold text-sm rounded-lg px-4 py-2.5 transition-colors whitespace-nowrap"
          >
            {loading ? 'Scanning…' : 'Analyze'}
          </button>
        </div>

        {loading && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1 flex-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full animate-pulse w-2/3" />
            </div>
            <span className="text-[10px] font-mono text-gray-600">fetching signals…</span>
          </div>
        )}

        {error && (
          <p className="mt-3 text-xs font-mono text-red-400">{error}</p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="mt-4 space-y-4">
          {/* Summary bar */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-mono text-gray-400 truncate">{analyzedRepo}</p>
                <p className="text-[10px] font-mono text-gray-600 mt-0.5">
                  {result.file_count} files · {detectedCount} signals detected
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-emerald-400">{detectedCount}</div>
                <div className="text-[9px] font-mono text-gray-600">signals</div>
              </div>
            </div>

            {/* Stack badges */}
            <StackBadges signals={result.signals} variant="compact" />
          </div>

          {/* Signal grid */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-[9px] font-mono text-gray-600 uppercase tracking-wider mb-3">
              signal scan
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(SIGNAL_LABELS).map(([key, label]) => {
                const hit = !!result.signals[key]
                return (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className={`text-[10px] flex-shrink-0 ${hit ? 'text-emerald-500' : 'text-gray-700'}`}>
                      {hit ? '✓' : '–'}
                    </span>
                    <span className={`text-[10px] font-mono truncate ${hit ? 'text-gray-300' : 'text-gray-700'}`}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent PRs if any */}
          {result.gh_data?.prs?.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-[9px] font-mono text-gray-600 uppercase tracking-wider mb-2">open prs</div>
              {result.gh_data.prs.map(p => (
                <div key={p.number} className="flex items-center gap-2 py-1.5 border-b border-gray-800 last:border-0">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">#{p.number}</span>
                  <span className="text-[11px] font-mono text-gray-300 truncate flex-1">{p.title}</span>
                  <span className="text-[9px] font-mono text-gray-600">@{p.user.login}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-4 text-center">
            <p className="text-xs font-mono text-emerald-400 mb-1">Want the full checklist?</p>
            <p className="text-[10px] font-mono text-gray-500 mb-3">
              Sign in to track progress, sync private repos, and create PRs.
            </p>
            <a
              href="/auth/signin"
              className="inline-flex items-center gap-2 bg-white text-gray-900 rounded-lg px-4 py-2 text-xs font-semibold hover:bg-gray-100 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Sign in with GitHub
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
