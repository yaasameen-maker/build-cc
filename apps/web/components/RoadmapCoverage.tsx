'use client'

import type { SignalMap } from '@/lib/types'

interface Topic { label: string; signals: string[] }
interface Roadmap {
  id: string; name: string; icon: string; url: string; topics: Topic[]
}

const ROADMAPS: Roadmap[] = [
  {
    id: 'frontend', name: 'Frontend', icon: '🖥',
    url: 'https://roadmap.sh/frontend',
    topics: [
      { label: 'Package Management',   signals: ['has_package_json'] },
      { label: 'Progressive Web Apps', signals: ['has_pwa'] },
      { label: 'Authentication',       signals: ['has_auth_file'] },
      { label: 'E2E Testing',          signals: ['has_e2e'] },
      { label: 'TypeScript / JS',      signals: ['has_package_json'] },
      { label: 'CI / CD',              signals: ['has_cicd'] },
    ],
  },
  {
    id: 'backend', name: 'Backend', icon: '⚙',
    url: 'https://roadmap.sh/backend',
    topics: [
      { label: 'REST APIs / OpenAPI',    signals: ['has_openapi'] },
      { label: 'Databases & Migrations', signals: ['has_db_schema', 'has_migrations'] },
      { label: 'Authentication',         signals: ['has_auth_file'] },
      { label: 'Unit Testing',           signals: ['has_unit_tests'] },
      { label: 'Docker',                 signals: ['has_docker', 'has_dockerfile'] },
      { label: 'CORS',                   signals: ['has_cors'] },
      { label: 'Health Endpoints',       signals: ['has_health'] },
      { label: 'Monorepo',               signals: ['has_monorepo'] },
    ],
  },
  {
    id: 'devops', name: 'DevOps', icon: '🚀',
    url: 'https://roadmap.sh/devops',
    topics: [
      { label: 'Containers (Docker)',  signals: ['has_docker', 'has_dockerfile'] },
      { label: 'CI / CD Pipelines',   signals: ['has_cicd'] },
      { label: 'Observability (OTel)', signals: ['has_otel'] },
      { label: 'Security Scanning',   signals: ['has_security_scan'] },
      { label: 'Deploy Config / IaC', signals: ['has_railway', 'has_deploy_config'] },
    ],
  },
  {
    id: 'ai-engineer', name: 'AI Engineer', icon: '🧠',
    url: 'https://roadmap.sh/ai-engineer',
    topics: [
      { label: 'LLM Integration',    signals: ['has_openrouter'] },
      { label: 'Vector DBs / RAG',   signals: ['has_vector_db'] },
      { label: 'Computer Vision',    signals: ['has_computer_vision'] },
      { label: 'AI Memory & State',  signals: ['has_memory'] },
      { label: 'Model Evaluation',   signals: ['has_evals'] },
      { label: 'AI Tools & Agents',  signals: ['has_tools'] },
      { label: 'Prompt Engineering', signals: ['has_prompts'] },
      { label: 'MCP Protocol',       signals: ['has_mcp'] },
      { label: 'Adapter Layer',      signals: ['has_adapter'] },
    ],
  },
  {
    id: 'computer-vision', name: 'Computer Vision', icon: '👁',
    url: 'https://roadmap.sh/computer-vision',
    topics: [
      { label: 'CV Frameworks',      signals: ['has_computer_vision'] },
      { label: 'Model Evaluation',   signals: ['has_evals'] },
      { label: 'Vector Embeddings',  signals: ['has_vector_db'] },
    ],
  },
  {
    id: 'mlops', name: 'MLOps', icon: '⚗',
    url: 'https://roadmap.sh/mlops',
    topics: [
      { label: 'Model Evaluation',   signals: ['has_evals'] },
      { label: 'Observability',      signals: ['has_otel'] },
      { label: 'Docker / Containers',signals: ['has_docker', 'has_dockerfile'] },
      { label: 'CI / CD',            signals: ['has_cicd'] },
      { label: 'Security',           signals: ['has_security_scan'] },
    ],
  },
]

function topicHit(topic: Topic, signals: SignalMap) {
  return topic.signals.some(s => signals[s])
}

interface Props { signals: SignalMap }

export default function RoadmapCoverage({ signals }: Props) {
  const hasAnySignal = Object.values(signals).some(Boolean)

  const activeRoadmaps = ROADMAPS.filter(r => r.topics.some(t => topicHit(t, signals)))

  if (!hasAnySignal) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 text-center text-xs font-mono text-gray-600">
        sync a repo to see roadmap coverage
      </div>
    )
  }

  if (activeRoadmaps.length === 0) return null

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">roadmap coverage</div>
        <a
          href="https://roadmap.sh"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] font-mono text-gray-600 hover:text-emerald-400 transition-colors"
        >
          roadmap.sh ↗
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {activeRoadmaps.map(roadmap => {
          const hitTopics = roadmap.topics.filter(t => topicHit(t, signals))
          const missTopics = roadmap.topics.filter(t => !topicHit(t, signals))
          const pct = Math.round((hitTopics.length / roadmap.topics.length) * 100)

          return (
            <div key={roadmap.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{roadmap.icon}</span>
                  <span className="text-xs font-semibold">{roadmap.name}</span>
                </div>
                <a
                  href={roadmap.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] font-mono text-gray-600 hover:text-emerald-400 transition-colors"
                >
                  view ↗
                </a>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[9px] font-mono text-gray-500">{hitTopics.length}/{roadmap.topics.length}</span>
              </div>

              {/* Topics */}
              <div className="flex flex-wrap gap-1">
                {hitTopics.map(t => (
                  <span key={t.label} className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-800/50">
                    {t.label}
                  </span>
                ))}
                {missTopics.map(t => (
                  <span key={t.label} className="text-[9px] font-mono px-1.5 py-0.5 rounded-full text-gray-600 border border-gray-800">
                    {t.label}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
