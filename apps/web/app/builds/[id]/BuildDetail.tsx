'use client'

import { useState, useCallback, useEffect } from 'react'
import { saveBuild, flushPRQueue } from '@/lib/idb'
import Link from 'next/link'
import type { Build, DeployConfig, SyncResponse } from '@/lib/types'
import { getItemState, EMPTY_DEP } from '@/lib/types'
import { FE_SECTIONS, BE_SECTIONS, ALL_SECTIONS } from '@/lib/sections'
import ChecklistSection from '@/components/ChecklistSection'
import SyncBar from '@/components/SyncBar'
import DeploymentPanel from '@/components/DeploymentPanel'
import AgentScripts from '@/components/AgentScripts'
import { QueuedActionsList } from '@/components/scripts/QueuedActionsList'
import AgentReviewPanel from '@/components/AgentReviewPanel'
import { toProjectStack } from '@/lib/project-stack'
import SignalDebug from '@/components/SignalDebug'
import ResourcesTab from '@/components/ResourcesTab'
import StackBadges from '@/components/StackBadges'
import RoadmapCoverage from '@/components/RoadmapCoverage'
import CreatePRModal from '@/components/CreatePRModal'
import CodeScanResults from '@/components/CodeScanResults'
import InteractiveCommitsList from '@/components/InteractiveCommitsList'
type Tab = 'checklist' | 'github-scan' | 'deployment' | 'scripts' | 'resources'
type CLView = 'fe' | 'be'
type SyncState = 'idle' | 'scanning' | 'done' | 'error'

interface Props { build: Build }

export default function BuildDetail({ build: initialBuild }: Props) {
  const [build, setBuild] = useState<Build>(initialBuild)
  const [tab, setTab] = useState<Tab>('checklist')
  const [clView, setClView] = useState<CLView>('fe')
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [syncMsg, setSyncMsg] = useState(
    initialBuild.last_scan
      ? `Last scanned ${new Date(initialBuild.last_scan).toLocaleTimeString()} — ${
          Object.keys(initialBuild.auto_checks ?? {}).filter(k => k.startsWith('auto:')).length
        } auto-verified`
      : 'Not scanned — click sync + scan to auto-detect checklist items'
  )
  const [syncProgress, setSyncProgress] = useState(0)
  const [branches, setBranches] = useState<string[]>([])
  const selectedBranch = ''
  const [expandedPR, setExpandedPR] = useState<number | null>(null)
  const [prFiles, setPrFiles] = useState<{ filename: string; status: string; additions: number; deletions: number; patch: string | null }[]>([])
  const [prFilesLoading, setPrFilesLoading] = useState(false)
  const [showCreatePR, setShowCreatePR] = useState(false)

  useEffect(() => {
    if (!build.repo) return
    fetch(`/api/github/branches?repo=${encodeURIComponent(build.repo)}`)
      .then(r => r.json())
      .then(data => Array.isArray(data) && setBranches(data))
      .catch(() => {})
  }, [build.repo])

  // Flush any queued PRs when connectivity is restored
  useEffect(() => {
    async function drainQueue() {
      try {
        const queued = await flushPRQueue()
        for (const { value } of queued) {
          await fetch('/api/github/pulls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(value),
          }).catch(() => {})
        }
        if (queued.length > 0) {
          setSyncMsg(`${queued.length} queued PR(s) sent`)
          setSyncState('done')
          setTimeout(() => setSyncState('idle'), 4000)
        }
      } catch { /* IndexedDB not available in all contexts */ }
    }
    window.addEventListener('online', drainQueue)
    return () => window.removeEventListener('online', drainQueue)
  }, [])

  async function loadPrFiles(prNumber: number) {
    if (!build.repo) return
    if (expandedPR === prNumber) { setExpandedPR(null); setPrFiles([]); return }
    setExpandedPR(prNumber)
    setPrFiles([])
    setPrFilesLoading(true)
    try {
      const res = await fetch(`/api/github/pr-files?repo=${encodeURIComponent(build.repo)}&pr=${prNumber}`)
      const data = await res.json()
      setPrFiles(Array.isArray(data) ? data : [])
    } catch { setPrFiles([]) }
    finally { setPrFilesLoading(false) }
  }

  async function patch(data: object) {
    const res = await fetch(`/api/builds/${build.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) console.error('[patch] save failed:', res.status, await res.json().catch(() => ({})))
  }

  // ── Sync ──────────────────────────────────────────────────────────────────
  async function fullSync() {
    if (!build.repo) return
    const [owner, repo] = build.repo.split('/')
    setSyncState('scanning')
    setSyncProgress(10)
    setSyncMsg('Fetching commits, PRs, issues…')

    try {
      setSyncProgress(40)
      setSyncMsg('Scanning file tree…')
      const res = await fetch(`/api/sync/${owner}/${repo}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: selectedBranch || undefined }),
      })

      setSyncProgress(80)
      setSyncMsg('Extracting signals…')

      if (!res.ok) throw new Error('Sync failed')
      const data: SyncResponse = await res.json()

      setSyncProgress(100)
      const autoCount = Object.keys(data.auto_checks).filter(k => k.startsWith('auto:')).length
      const reviewCount = Object.keys(data.auto_checks).filter(k => k.startsWith('review:')).length
      setSyncMsg(`Scan complete — ${autoCount} auto-verified, ${reviewCount} flagged for review`)
      setSyncState('done')

      const lastScan = new Date().toISOString()
      const updated = { ...build, signals: data.signals, auto_checks: data.auto_checks, gh_data: data.gh_data, last_scan: lastScan }
      setBuild(updated)
      saveBuild(updated).catch(() => {})
      await patch({ signals: data.signals, auto_checks: data.auto_checks, gh_data: data.gh_data, last_scan: lastScan })

      setTimeout(() => setSyncState('idle'), 4000)
    } catch {
      setSyncState('error')
      setSyncMsg('Sync failed — check that the API is running and your GitHub token has repo scope')
    }
  }

  // ── Checklist toggle ──────────────────────────────────────────────────────
  const toggleItem = useCallback(async (secId: string, itemId: string) => {
    const state = getItemState(build, secId, itemId)
    if (state === 'auto') return
    const key = `${secId}:${itemId}`
    const next = { ...build, checks: { ...build.checks, [key]: !build.checks?.[key] } }
    setBuild(next)
    await fetch(`/api/builds/${build.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checks: next.checks }),
    })
  }, [build])

  // ── Deployment save ───────────────────────────────────────────────────────
  const saveDep = useCallback(async (dep: DeployConfig) => {
    setBuild(b => ({ ...b, dep }))
    await fetch(`/api/builds/${build.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dep }),
    })
  }, [build.id])

  // ── Progress ──────────────────────────────────────────────────────────────
  const sections = clView === 'fe' ? FE_SECTIONS : BE_SECTIONS
  const allDone = ALL_SECTIONS.flatMap(s => s.items).filter(item => {
    const sec = ALL_SECTIONS.find(s => s.items.includes(item))!
    const st = getItemState(build, sec.id, item.id)
    return st === 'auto' || st === 'manual'
  }).length
  const allTotal = ALL_SECTIONS.flatMap(s => s.items).length
  const autoDone = Object.keys(build.auto_checks ?? {}).filter(k => k.startsWith('auto:')).length
  const manualDone = allDone - autoDone
  const reviewCount = Object.keys(build.auto_checks ?? {}).filter(k => k.startsWith('review:')).length
  const pct = allTotal ? Math.round(allDone / allTotal * 100) : 0
  const autoPct = allTotal ? Math.round(autoDone / allTotal * 100) : 0
  const manualPct = allTotal ? Math.round(manualDone / allTotal * 100) : 0
  const reviewPct = allTotal ? Math.round(reviewCount / allTotal * 100) : 0

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-4 py-3 flex items-center gap-2 min-h-[48px]">
        <Link href="/builds" className="text-gray-500 hover:text-gray-300 text-sm transition-colors px-1 min-w-[32px] flex items-center justify-center">←</Link>
        <span className="font-bold text-base tracking-tight flex-shrink-0">
          build<span className="text-emerald-400">.</span>cc
        </span>
        <span className="text-gray-600 text-xs font-mono truncate">/ {build.name}</span>
        {build.repo && (
          <a href={`https://github.com/${build.repo}`} target="_blank" rel="noopener noreferrer"
            className="hidden sm:block text-[10px] font-mono text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0 ml-auto">
            {build.repo} ↗
          </a>
        )}
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Build header */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
            {[
              { label: 'frontend', value: `${FE_SECTIONS.flatMap(s=>s.items).filter(i=>{const s=FE_SECTIONS.find(sec=>sec.items.includes(i))!;const st=getItemState(build,s.id,i.id);return st==='auto'||st==='manual'}).length}/${FE_SECTIONS.flatMap(s=>s.items).length}`, color: 'text-violet-400', mobileHide: false },
              { label: 'backend', value: `${BE_SECTIONS.flatMap(s=>s.items).filter(i=>{const s=BE_SECTIONS.find(sec=>sec.items.includes(i))!;const st=getItemState(build,s.id,i.id);return st==='auto'||st==='manual'}).length}/${BE_SECTIONS.flatMap(s=>s.items).length}`, color: 'text-blue-400', mobileHide: false },
              { label: 'overall', value: `${pct}%`, color: 'text-amber-400', mobileHide: false },
              { label: 'auto-verified', value: String(autoDone), color: 'text-emerald-400', mobileHide: true },
              { label: 'need review', value: String(reviewCount), color: 'text-amber-500', mobileHide: true },
            ].map(({ label, value, color, mobileHide }) => (
              <div key={label} className={`bg-gray-800 rounded-lg p-2 text-center ${mobileHide ? 'hidden sm:block' : ''}`}>
                <div className={`text-sm font-semibold font-mono ${color}`}>{value}</div>
                <div className="text-[9px] font-mono text-gray-600 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Tricolor progress bar */}
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${autoPct}%` }} />
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${manualPct}%` }} />
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${reviewPct}%` }} />
          </div>
          <div className="flex gap-3 mt-1.5 text-[9px] font-mono text-gray-700">
            <span><span className="text-emerald-500">■</span> auto</span>
            <span><span className="text-indigo-500">■</span> manual</span>
            <span><span className="text-amber-500">■</span> review</span>
          </div>

          {/* Stack badges — compact row */}
          {Object.keys(build.signals ?? {}).length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <StackBadges signals={build.signals ?? {}} variant="compact" />
            </div>
          )}
        </div>

        {/* Branch selector + sync bar */}
        {build.repo && (
          <div className="mb-3">
            <SyncBar state={syncState} message={syncMsg} progress={syncProgress} onSync={fullSync} />
          </div>
        )}

        {/* Legend */}
        {build.last_scan && (
          <div className="flex gap-4 mb-3 text-[10px] font-mono text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" /> auto-verified by GitHub
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-indigo-500" /> manually checked
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm border border-amber-500 bg-amber-500/10 flex items-center justify-center text-[8px] font-bold text-amber-500">?</div>
              needs review
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-800 mb-4 overflow-x-auto scrollbar-none">
          {(['checklist', 'github-scan', 'deployment', 'scripts', 'resources'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs font-mono px-3 sm:px-4 py-3 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 min-h-[44px] ${
                tab === t
                  ? 'border-white text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'github-scan' ? 'github scan' : t}
            </button>
          ))}
        </div>

        {/* Checklist tab */}
        {tab === 'checklist' && (
          <>
            <div className="flex gap-1 p-1 bg-gray-800/60 rounded-lg mb-3">
              <button
                onClick={() => setClView('fe')}
                className={`flex-1 text-xs font-mono py-1.5 rounded-md transition-all ${clView === 'fe' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                🖥 frontend
              </button>
              <button
                onClick={() => setClView('be')}
                className={`flex-1 text-xs font-mono py-1.5 rounded-md transition-all ${clView === 'be' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                ⚙ backend
              </button>
            </div>
            {sections.map(sec => (
              <ChecklistSection key={sec.id} section={sec} build={build} onToggle={toggleItem} />
            ))}
            <SignalDebug
              signals={build.signals ?? {}}
              commits={build.gh_data?.commits ?? []}
              prs={build.gh_data?.prs ?? []}
              issues={build.gh_data?.issues ?? []}
              lastScan={build.last_scan}
              repo={build.repo}
            />
          </>
        )}

        {/* GitHub Scan tab */}
        {tab === 'github-scan' && build.repo && (
          <>
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setShowCreatePR(true)}
                className="text-[11px] font-mono px-3 py-1.5 rounded-lg border border-emerald-700 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                + create PR
              </button>
            </div>

            <CodeScanResults repo={build.repo} />
            <AgentReviewPanel repo={build.repo} userId={String(build.user_id)} />

            <InteractiveCommitsList commits={build.gh_data?.commits ?? []} repo={build.repo} />

            {Object.keys(build.signals ?? {}).length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
                <StackBadges signals={build.signals ?? {}} variant="full" />
              </div>
            )}
            <RoadmapCoverage signals={build.signals ?? {}} />

            {(build.gh_data?.prs?.length ?? 0) > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
                <div className="text-[9px] font-mono text-gray-600 uppercase tracking-wider mb-2">pr diff viewer</div>
                {build.gh_data.prs.map(p => (
                  <div key={p.number}>
                    <button
                      onClick={() => loadPrFiles(p.number)}
                      className="w-full flex items-center gap-2 py-1.5 border-b border-gray-800 last:border-0 hover:bg-gray-800/50 rounded px-1 transition-colors text-left"
                    >
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 flex-shrink-0">#{p.number}</span>
                      <span className="text-[11px] font-mono text-gray-300 truncate flex-1">{p.title}</span>
                      <span className="text-[9px] font-mono text-gray-600">@{p.user.login}</span>
                      <span className={`text-[9px] font-mono flex-shrink-0 transition-transform ${expandedPR === p.number ? 'text-emerald-400' : 'text-gray-600'}`}>
                        {expandedPR === p.number ? '▾' : '▸'}
                      </span>
                    </button>
                    {expandedPR === p.number && (
                      <div className="mt-2 mb-3 ml-2 space-y-2">
                        {prFilesLoading && (
                          <div className="text-[10px] font-mono text-gray-600 py-2">loading files…</div>
                        )}
                        {!prFilesLoading && prFiles.length === 0 && (
                          <div className="text-[10px] font-mono text-gray-600 py-2">no files</div>
                        )}
                        {prFiles.map(f => (
                          <div key={f.filename} className="bg-gray-800 rounded-lg p-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

          </>
        )}
        {tab === 'github-scan' && !build.repo && (
          <div className="text-center py-8 text-gray-700 font-mono text-xs">link a repo to use github scan</div>
        )}


        {/* Deployment tab */}
        {tab === 'deployment' && (
          <DeploymentPanel dep={build.dep ?? EMPTY_DEP} onChange={saveDep} />
        )}

        {/* Scripts tab */}
        {tab === 'scripts' && (
          <>
            <AgentScripts stack={toProjectStack(build.signals ?? {})} repoFullName={build.repo ?? undefined} />
            {build.repo && <QueuedActionsList repoFullName={build.repo} />}
          </>
        )}

        {/* Resources tab */}
        {tab === 'resources' && <ResourcesTab repo={build.repo} prs={build.gh_data?.prs ?? []} />}
      </div>

      {showCreatePR && build.repo && (
        <CreatePRModal
          repo={build.repo}
          branches={branches}
          defaultBase={selectedBranch || branches.find(b => b === 'main') || branches[0] || 'main'}
          onClose={() => setShowCreatePR(false)}
          onCreated={pr => {
            setSyncMsg(`PR #${pr.number} created — ${pr.url}`)
            setSyncState('done')
            setTimeout(() => setSyncState('idle'), 6000)
          }}
        />
      )}
    </div>
  )
}
