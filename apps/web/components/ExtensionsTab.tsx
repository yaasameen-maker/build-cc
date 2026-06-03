'use client'

import { useState } from 'react'
import type { GHPR } from '@/lib/types'
import { savePRReview, getCachedPRReview } from '@/lib/idb'

interface PRReview { id: number; state: string; body: string; submitted_at: string }
interface PRComment { id: number; path: string; line: number; body: string; created_at: string }
interface PRAgentData { bot: string; reviews: PRReview[]; comments: PRComment[] }

const PR_AGENT_YAML = `# Add to .github/workflows/pr-agent.yml
on:
  pull_request:
  pull_request_review_comment:
    types: [created]

jobs:
  pr-agent:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
    steps:
      - name: PR Agent action
        uses: Codium-ai/pr-agent@main
        env:
          OPENAI_KEY: \${{ secrets.OPENAI_API_KEY }}
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}`

interface Props {
  repo: string | null
  prs: GHPR[]
}

export default function ExtensionsTab({ repo, prs }: Props) {
  const [selectedPR, setSelectedPR] = useState<number | null>(null)
  const [agentData, setAgentData] = useState<PRAgentData | null>(null)
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentError, setAgentError] = useState('')
  const [fromCache, setFromCache] = useState(false)
  const [serverUrl, setServerUrl] = useState('')
  const [botUser, setBotUser] = useState('github-actions[bot]')
  const [showConfig, setShowConfig] = useState(false)
  const [copiedYaml, setCopiedYaml] = useState(false)

  async function fetchAgentReview(prNumber: number) {
    if (!repo) return
    setSelectedPR(prNumber)
    setAgentData(null)
    setAgentError('')
    setAgentLoading(true)

    // Try cache first
    try {
      const cached = await getCachedPRReview(repo, prNumber)
      if (cached) {
        setAgentData(cached.data as PRAgentData)
        setFromCache(true)
        setAgentLoading(false)
        return
      }
    } catch { /* ignore */ }

    try {
      const params = new URLSearchParams({ repo, pr: String(prNumber), bot: botUser })
      if (serverUrl) params.set('serverUrl', serverUrl)
      const res = await fetch(`/api/github/pr-agent?${params}`)
      const data = await res.json()
      if (!res.ok) { setAgentError(data.error ?? 'Failed'); setAgentLoading(false); return }
      setAgentData(data)
      setFromCache(false)
      savePRReview(repo, prNumber, data).catch(() => {})
    } catch {
      setAgentError('Could not reach server')
    }
    setAgentLoading(false)
  }

  function copyYaml() {
    navigator.clipboard.writeText(PR_AGENT_YAML).then(() => {
      setCopiedYaml(true)
      setTimeout(() => setCopiedYaml(false), 2000)
    })
  }

  // Group comments by file
  const commentsByFile: Record<string, PRComment[]> = {}
  agentData?.comments.forEach(c => {
    if (!commentsByFile[c.path]) commentsByFile[c.path] = []
    commentsByFile[c.path].push(c)
  })
  const hasReviews = agentData && (agentData.reviews.length > 0 || agentData.comments.length > 0)

  return (
    <div className="space-y-4">

      {/* PR Agent */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-white">PR Agent</div>
            <div className="text-[10px] font-mono text-gray-500 mt-0.5">open-source AI code reviewer</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-[9px] font-mono text-gray-600 hover:text-gray-400 transition-colors"
            >
              {showConfig ? 'hide config' : 'config'}
            </button>
            <a
              href="https://github.com/Codium-ai/pr-agent"
              target="_blank" rel="noopener noreferrer"
              className="text-[9px] font-mono text-gray-600 hover:text-emerald-400 transition-colors"
            >
              github ↗
            </a>
          </div>
        </div>

        {showConfig && (
          <div className="mb-3 space-y-2 bg-gray-800/50 rounded-lg p-3">
            <div>
              <label className="text-[9px] font-mono text-gray-600 block mb-1">bot username</label>
              <input
                type="text"
                value={botUser}
                onChange={e => setBotUser(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[11px] font-mono text-gray-300 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[9px] font-mono text-gray-600 block mb-1">self-hosted server URL (optional)</label>
              <input
                type="text"
                value={serverUrl}
                onChange={e => setServerUrl(e.target.value)}
                placeholder="https://your-pr-agent.example.com"
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[11px] font-mono text-gray-300 focus:outline-none focus:border-emerald-500 placeholder-gray-700"
              />
            </div>
          </div>
        )}

        {!repo ? (
          <p className="text-[10px] font-mono text-gray-600">link a repo to use PR Agent</p>
        ) : prs.length === 0 ? (
          <p className="text-[10px] font-mono text-gray-600">no open PRs — sync the repo first</p>
        ) : (
          <>
            <div className="text-[9px] font-mono text-gray-600 uppercase tracking-wider mb-2">select a PR</div>
            <div className="space-y-1 mb-3">
              {prs.map(p => (
                <button
                  key={p.number}
                  onClick={() => fetchAgentReview(p.number)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                    selectedPR === p.number ? 'bg-emerald-500/10 border border-emerald-700' : 'hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">#{p.number}</span>
                  <span className="text-[11px] font-mono text-gray-300 truncate flex-1">{p.title}</span>
                  <span className="text-[9px] font-mono text-gray-600">@{p.user.login}</span>
                </button>
              ))}
            </div>

            {agentLoading && (
              <div className="flex items-center gap-2 py-2">
                <div className="h-0.5 flex-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full animate-pulse w-1/2" />
                </div>
                <span className="text-[10px] font-mono text-gray-600">fetching reviews…</span>
              </div>
            )}

            {agentError && <p className="text-[10px] font-mono text-red-400">{agentError}</p>}

            {agentData && !agentLoading && (
              <>
                {fromCache && (
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-[8px] font-mono text-gray-700 bg-gray-800 px-1.5 py-0.5 rounded">offline — cached</span>
                  </div>
                )}

                {!hasReviews && (
                  <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg p-3 mt-2">
                    <p className="text-[11px] font-mono text-amber-400 mb-2">No PR Agent reviews found on this PR.</p>
                    <p className="text-[10px] font-mono text-gray-500 mb-3">
                      Add PR Agent to your repo as a GitHub Action — it will automatically review every PR.
                    </p>
                    <button
                      onClick={copyYaml}
                      className="text-[9px] font-mono px-2.5 py-1 rounded border border-emerald-700 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    >
                      {copiedYaml ? '✓ copied!' : 'copy workflow YAML'}
                    </button>
                    {copiedYaml && (
                      <p className="text-[9px] font-mono text-gray-600 mt-2">
                        Paste into .github/workflows/pr-agent.yml and add OPENAI_API_KEY to your repo secrets.
                      </p>
                    )}
                  </div>
                )}

                {agentData.reviews.map(r => (
                  <div key={r.id} className="bg-gray-800 rounded-lg p-3 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        r.state === 'APPROVED' ? 'bg-emerald-900/40 text-emerald-400' :
                        r.state === 'CHANGES_REQUESTED' ? 'bg-red-900/40 text-red-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>{r.state}</span>
                      <span className="text-[9px] font-mono text-gray-600">{new Date(r.submitted_at).toLocaleDateString()}</span>
                    </div>
                    {r.body && (
                      <p className="text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap">{r.body.slice(0, 1500)}</p>
                    )}
                  </div>
                ))}

                {Object.entries(commentsByFile).map(([file, comments]) => (
                  <div key={file} className="mt-2 bg-gray-800 rounded-lg overflow-hidden">
                    <div className="px-3 py-1.5 bg-gray-700/50 text-[9px] font-mono text-gray-400">{file}</div>
                    {comments.map(c => (
                      <div key={c.id} className="px-3 py-2 border-t border-gray-700">
                        <span className="text-[9px] font-mono text-gray-600 block mb-1">line {c.line}</span>
                        <p className="text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap">{c.body.slice(0, 800)}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* DeepWiki */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-semibold text-white">DeepWiki</div>
            <div className="text-[10px] font-mono text-gray-500 mt-0.5">auto-generated repo documentation</div>
          </div>
          {repo && (
            <a
              href={`https://deepwiki.com/${repo}`}
              target="_blank" rel="noopener noreferrer"
              className="text-[10px] font-mono px-2.5 py-1 rounded border border-gray-700 text-gray-400 hover:border-emerald-600 hover:text-emerald-400 transition-colors"
            >
              open ↗
            </a>
          )}
        </div>
        <p className="text-[10px] font-mono text-gray-600">
          DeepWiki reads your GitHub repo and generates wiki-style docs — architecture, data flow, and component explanations. Online only.
        </p>
        {!repo && <p className="text-[10px] font-mono text-gray-700 mt-1">link a repo to generate the URL</p>}
      </div>

      {/* Continue */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-sm font-semibold text-white">Continue</div>
            <div className="text-[10px] font-mono text-gray-500 mt-0.5">AI code assistant for VS Code + JetBrains</div>
          </div>
          <a
            href="https://github.com/continuedev/continue"
            target="_blank" rel="noopener noreferrer"
            className="text-[10px] font-mono px-2.5 py-1 rounded border border-gray-700 text-gray-400 hover:border-emerald-600 hover:text-emerald-400 transition-colors"
          >
            github ↗
          </a>
        </div>
        <p className="text-[10px] font-mono text-gray-600">
          Open-source AI assistant that runs in your editor. Supports local models via Ollama for fully offline code assistance — autocomplete, chat, and inline edits without sending code to the cloud.
        </p>
      </div>

    </div>
  )
}
