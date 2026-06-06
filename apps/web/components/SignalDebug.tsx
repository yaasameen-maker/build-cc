'use client'

import { useState } from 'react'
import type { SignalMap } from '@/lib/types'
import type { GHCommit, GHPR, GHIssue } from '@/lib/types'
import { saveCommit, getCachedCommit } from '@/lib/idb'

const SIGNAL_LABELS: Record<string, string> = {
  has_package_json: 'package.json',
  has_readme: 'README.md',
  has_env_example: '.env.example',
  has_cicd: '.github/workflows/',
  has_docker: 'docker-compose.yml',
  has_dockerfile: 'Dockerfile',
  has_db_schema: 'DB schema (prisma/alembic)',
  has_migrations: 'migrations/',
  has_seeds: 'seed data',
  has_e2e: 'E2E tests (playwright/cypress)',
  has_unit_tests: 'unit tests',
  has_deploy_config: 'deploy config (vercel/netlify/railway)',
  has_railway: 'railway.toml',
  has_license: 'LICENSE file',
  has_pwa: 'PWA manifest + SW',
  has_openapi: 'openapi.yaml / swagger',
  has_otel: 'OpenTelemetry / Langfuse',
  has_mcp: 'MCP config',
  has_tools: 'tools/ or agents/ dir',
  has_scripts: 'scripts/ (.py/.ts)',
  has_adapter: 'adapter pattern file',
  has_prompts: 'prompts/ or SYSTEM.md',
  has_vector_db: 'vector DB dependency',
  has_evals: 'evals/ or golden dataset',
  has_memory: 'Honcho / memory backend',
  has_health: 'health check route',
  has_cors: 'CORS config',
  has_auth_file: 'auth module',
  has_openrouter: 'OpenRouter / LiteLLM',
  has_backend_deps: 'backend manifest',
  has_monorepo: 'monorepo workspace',
  has_supabase: 'Supabase config',
  has_security_scan: 'security scanner in CI',
  has_license_check: 'license-checker in CI',
  has_lighthouse_ci: 'Lighthouse CI',
  has_changelog: 'CHANGELOG / session notes',
  has_cicd_deploy: 'deploy step in CI',
}

interface CommitFile { filename: string; status: string; additions: number; deletions: number; patch: string | null }
interface CommitDetail { sha: string; message: string; author: string; date: string; files: CommitFile[] }

interface Props {
  signals: SignalMap
  commits: GHCommit[]
  prs: GHPR[]
  issues: GHIssue[]
  lastScan: string | null
  repo?: string | null
}

export default function SignalDebug({ signals, commits, prs, issues, lastScan, repo }: Props) {
  const detected = Object.values(signals).filter(Boolean).length
  const total = Object.keys(SIGNAL_LABELS).length

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

    // Try cache first
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

  return (
    <div className="space-y-4">
      {/* Commits — clickable to view code */}
      {commits.length > 0 && (
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
      )}

      {/* PRs */}
      {prs.length > 0 && (
        <div>
          <div className="text-[9px] font-mono text-gray-600 uppercase tracking-wider mb-2">open PRs</div>
          {prs.map(p => (
            <div key={p.number} className="flex items-center gap-2 py-1.5 border-b border-gray-800 last:border-0">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">#{p.number}</span>
              <span className="text-[11px] font-mono text-gray-300 truncate flex-1">{p.title}</span>
              <span className="text-[9px] font-mono text-gray-600">@{p.user.login}</span>
            </div>
          ))}
        </div>
      )}

      {/* Issues */}
      {issues.length > 0 && (
        <div>
          <div className="text-[9px] font-mono text-gray-600 uppercase tracking-wider mb-2">open issues</div>
          {issues.map(i => (
            <div key={i.number} className="flex items-center gap-2 py-1.5 border-b border-gray-800 last:border-0">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">#{i.number}</span>
              <span className="text-[11px] font-mono text-gray-300 truncate flex-1">{i.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Signal grid */}
      {lastScan && (
        <div>
          <div className="text-[9px] font-mono text-gray-600 uppercase tracking-wider mb-2">
            signal scan — {detected}/{total} detected · {new Date(lastScan).toLocaleTimeString()}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {Object.entries(SIGNAL_LABELS).map(([key, label]) => {
              const hit = !!signals[key]
              return (
                <div key={key} className="flex items-center gap-1.5 py-0.5">
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
      )}

      {!lastScan && commits.length === 0 && (
        <div className="text-center py-8 text-gray-700 font-mono text-xs">
          click sync + scan to fetch activity
        </div>
      )}
    </div>
  )
}
