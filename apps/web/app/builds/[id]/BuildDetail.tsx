'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import type { Build, DeployConfig, SyncResponse } from '@/lib/types'
import { getItemState, EMPTY_DEP } from '@/lib/types'
import { FE_SECTIONS, BE_SECTIONS, ALL_SECTIONS } from '@/lib/sections'
import ChecklistSection from '@/components/ChecklistSection'
import SyncBar from '@/components/SyncBar'
import DeploymentPanel from '@/components/DeploymentPanel'
import AgentScripts from '@/components/AgentScripts'
import SignalDebug from '@/components/SignalDebug'
import ResourcesTab from '@/components/ResourcesTab'

type Tab = 'checklist' | 'github' | 'deployment' | 'scripts' | 'resources'
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

  async function patch(data: object) {
    await fetch(`/api/builds/${build.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
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
        body: JSON.stringify({}),
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
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center gap-3">
        <Link href="/builds" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">←</Link>
        <span className="font-bold text-base tracking-tight">
          build<span className="text-emerald-400">.</span>cc
        </span>
        <span className="text-gray-600 text-xs font-mono">/ {build.name}</span>
        {build.repo && (
          <a href={`https://github.com/${build.repo}`} target="_blank" rel="noopener noreferrer"
            className="text-[10px] font-mono text-gray-600 hover:text-gray-400 transition-colors">
            {build.repo} ↗
          </a>
        )}
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-6">
        {/* Build header */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-5 gap-2 mb-3">
            {[
              { label: 'frontend', value: `${FE_SECTIONS.flatMap(s=>s.items).filter(i=>{const s=FE_SECTIONS.find(sec=>sec.items.includes(i))!;const st=getItemState(build,s.id,i.id);return st==='auto'||st==='manual'}).length}/${FE_SECTIONS.flatMap(s=>s.items).length}`, color: 'text-violet-400' },
              { label: 'backend', value: `${BE_SECTIONS.flatMap(s=>s.items).filter(i=>{const s=BE_SECTIONS.find(sec=>sec.items.includes(i))!;const st=getItemState(build,s.id,i.id);return st==='auto'||st==='manual'}).length}/${BE_SECTIONS.flatMap(s=>s.items).length}`, color: 'text-blue-400' },
              { label: 'overall', value: `${pct}%`, color: 'text-amber-400' },
              { label: 'auto-verified', value: String(autoDone), color: 'text-emerald-400' },
              { label: 'need review', value: String(reviewCount), color: 'text-amber-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-800 rounded-lg p-2 text-center">
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
        </div>

        {/* Sync bar */}
        {build.repo && (
          <SyncBar state={syncState} message={syncMsg} progress={syncProgress} onSync={fullSync} />
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
        <div className="flex gap-0 border-b border-gray-800 mb-4">
          {(['checklist', 'github', 'deployment', 'scripts', 'resources'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs font-mono px-4 py-2 border-b-2 transition-colors ${
                tab === t
                  ? 'border-white text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t}
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
          </>
        )}

        {/* GitHub tab */}
        {tab === 'github' && (
          <SignalDebug
            signals={build.signals ?? {}}
            commits={build.gh_data?.commits ?? []}
            prs={build.gh_data?.prs ?? []}
            issues={build.gh_data?.issues ?? []}
            lastScan={build.last_scan}
          />
        )}

        {/* Deployment tab */}
        {tab === 'deployment' && (
          <DeploymentPanel dep={build.dep ?? EMPTY_DEP} onChange={saveDep} />
        )}

        {/* Scripts tab */}
        {tab === 'scripts' && <AgentScripts />}

        {/* Resources tab */}
        {tab === 'resources' && <ResourcesTab />}
      </div>
    </div>
  )
}
