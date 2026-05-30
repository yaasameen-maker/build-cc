import type { SignalMap } from '@/lib/types'
import type { GHCommit, GHPR, GHIssue } from '@/lib/types'

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

interface Props {
  signals: SignalMap
  commits: GHCommit[]
  prs: GHPR[]
  issues: GHIssue[]
  lastScan: string | null
}

export default function SignalDebug({ signals, commits, prs, issues, lastScan }: Props) {
  const detected = Object.values(signals).filter(Boolean).length
  const total = Object.keys(SIGNAL_LABELS).length

  return (
    <div className="space-y-4">
      {/* Commits */}
      {commits.length > 0 && (
        <div>
          <div className="text-[9px] font-mono text-gray-600 uppercase tracking-wider mb-2">{commits.length} recent commits</div>
          {commits.slice(0, 10).map(c => (
            <div key={c.sha} className="flex items-start gap-2 py-1.5 border-b border-gray-800 last:border-0">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 flex-shrink-0">{c.sha.slice(0, 7)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-mono text-gray-300 truncate">{c.commit.message.split('\n')[0]}</div>
                <div className="text-[9px] font-mono text-gray-700 mt-0.5">{c.commit.author.name} · {new Date(c.commit.author.date).toLocaleDateString()}</div>
              </div>
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
