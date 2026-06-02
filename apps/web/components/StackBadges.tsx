'use client'

import type { SignalMap } from '@/lib/types'

interface ComponentDef {
  label: string
  icon: string
  color: string   // Tailwind border + text color classes
  signals: string[]   // any of these being true triggers the badge
}

const COMPONENTS: ComponentDef[] = [
  { label: 'Computer Vision',  icon: '👁',  color: 'border-violet-500/60 text-violet-400 bg-violet-900/20', signals: ['has_computer_vision'] },
  { label: 'Vector DB / RAG',  icon: '🔍',  color: 'border-indigo-500/60 text-indigo-400 bg-indigo-900/20', signals: ['has_vector_db'] },
  { label: 'LLM Routing',      icon: '🧠',  color: 'border-emerald-500/60 text-emerald-400 bg-emerald-900/20', signals: ['has_openrouter'] },
  { label: 'Memory / State',   icon: '🧵',  color: 'border-cyan-500/60 text-cyan-400 bg-cyan-900/20', signals: ['has_memory'] },
  { label: 'Evaluations',      icon: '📐',  color: 'border-amber-500/60 text-amber-400 bg-amber-900/20', signals: ['has_evals'] },
  { label: 'MCP Server',       icon: '🔌',  color: 'border-pink-500/60 text-pink-400 bg-pink-900/20', signals: ['has_mcp'] },
  { label: 'AI Tools',         icon: '🛠',  color: 'border-orange-500/60 text-orange-400 bg-orange-900/20', signals: ['has_tools'] },
  { label: 'Prompts',          icon: '💬',  color: 'border-sky-500/60 text-sky-400 bg-sky-900/20', signals: ['has_prompts'] },
  { label: 'Observability',    icon: '📊',  color: 'border-lime-500/60 text-lime-400 bg-lime-900/20', signals: ['has_otel'] },
  { label: 'Database',         icon: '🗄',  color: 'border-blue-500/60 text-blue-400 bg-blue-900/20', signals: ['has_db_schema', 'has_migrations'] },
  { label: 'Auth',             icon: '🔐',  color: 'border-red-500/60 text-red-400 bg-red-900/20', signals: ['has_auth_file'] },
  { label: 'CI / CD',          icon: '⚙',  color: 'border-gray-400/60 text-gray-300 bg-gray-700/30', signals: ['has_cicd'] },
  { label: 'Docker',           icon: '🐳',  color: 'border-sky-600/60 text-sky-400 bg-sky-900/20', signals: ['has_docker', 'has_dockerfile'] },
  { label: 'Security Scan',    icon: '🛡',  color: 'border-green-500/60 text-green-400 bg-green-900/20', signals: ['has_security_scan'] },
  { label: 'E2E Tests',        icon: '🧪',  color: 'border-purple-500/60 text-purple-400 bg-purple-900/20', signals: ['has_e2e'] },
  { label: 'Unit Tests',       icon: '✅',  color: 'border-teal-500/60 text-teal-400 bg-teal-900/20', signals: ['has_unit_tests'] },
  { label: 'OpenAPI',          icon: '📄',  color: 'border-yellow-500/60 text-yellow-400 bg-yellow-900/20', signals: ['has_openapi'] },
  { label: 'PWA',              icon: '📱',  color: 'border-fuchsia-500/60 text-fuchsia-400 bg-fuchsia-900/20', signals: ['has_pwa'] },
  { label: 'Monorepo',         icon: '📦',  color: 'border-gray-500/60 text-gray-400 bg-gray-800/40', signals: ['has_monorepo'] },
  { label: 'Supabase',         icon: '⚡',  color: 'border-emerald-600/60 text-emerald-400 bg-emerald-900/20', signals: ['has_supabase'] },
  { label: 'Railway',          icon: '🚂',  color: 'border-violet-600/60 text-violet-400 bg-violet-900/20', signals: ['has_railway'] },
  { label: 'Adapter Layer',    icon: '🔧',  color: 'border-rose-500/60 text-rose-400 bg-rose-900/20', signals: ['has_adapter'] },
  { label: 'CORS',             icon: '🌐',  color: 'border-slate-500/60 text-slate-400 bg-slate-800/40', signals: ['has_cors'] },
  { label: 'Health Check',     icon: '❤',  color: 'border-red-400/60 text-red-400 bg-red-900/20', signals: ['has_health'] },
]

interface Props {
  signals: SignalMap
  variant?: 'compact' | 'full'
}

export default function StackBadges({ signals, variant = 'compact' }: Props) {
  const detected = COMPONENTS.filter(c => c.signals.some(s => signals[s]))

  if (detected.length === 0) return null

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-1.5">
        {detected.map(c => (
          <span
            key={c.label}
            className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${c.color}`}
          >
            <span className="text-[11px]">{c.icon}</span>
            {c.label}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">detected in this build</div>
      <div className="grid grid-cols-3 gap-2">
        {detected.map(c => (
          <div
            key={c.label}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${c.color}`}
          >
            <span className="text-base leading-none">{c.icon}</span>
            <span className="text-[11px] font-mono font-medium">{c.label}</span>
          </div>
        ))}
      </div>
      {detected.length === 0 && (
        <div className="text-xs font-mono text-gray-600 py-4 text-center">
          sync a repo to detect components
        </div>
      )}
    </div>
  )
}
