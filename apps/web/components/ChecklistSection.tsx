'use client'

import { useState } from 'react'
import type { ChecklistSection as Section, Build, CheckState } from '@/lib/types'
import { getItemState } from '@/lib/types'
import { TAG_COLORS } from '@/lib/sections'
import { SIGNAL_FIXES } from '@/lib/signal-fixes'
import { saveFile, getCachedFile } from '@/lib/idb'

interface Props {
  section: Section
  build: Build
  onToggle: (secId: string, itemId: string) => void
}

function Checkbox({ state }: { state: CheckState }) {
  if (state === 'auto') return (
    <div className="w-3.5 h-3.5 rounded-sm bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-default" title="auto-verified by GitHub">
      <svg className="w-2 h-2 text-white" viewBox="0 0 10 8" fill="none">
        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
  if (state === 'manual') return (
    <div className="w-3.5 h-3.5 rounded-sm bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
      <svg className="w-2 h-2 text-white" viewBox="0 0 10 8" fill="none">
        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
  if (state === 'review') return (
    <div className="w-3.5 h-3.5 rounded-sm border-1.5 border-amber-500 bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-amber-500 font-bold" style={{ fontSize: 9 }}>
      ?
    </div>
  )
  return (
    <div className="w-3.5 h-3.5 rounded-sm border border-gray-600 flex-shrink-0 mt-0.5" />
  )
}

interface FixPanelProps {
  signalKey: string
  repo: string | null
}

function FixPanel({ signalKey, repo }: FixPanelProps) {
  const fix = SIGNAL_FIXES[signalKey]
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [loadingFile, setLoadingFile] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)

  if (!fix) return null

  async function viewFile(path: string) {
    if (!repo) return
    setLoadingFile(path)
    setFileContent(null)

    // Try cache first
    try {
      const cached = await getCachedFile(repo, path)
      if (cached) {
        setFileContent(cached.content)
        setFromCache(true)
        setLoadingFile(null)
        return
      }
    } catch { /* ignore */ }

    // Fetch from GitHub
    try {
      const res = await fetch(`/api/github/file?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`)
      if (res.ok) {
        const data = await res.json()
        setFileContent(data.content)
        setFromCache(false)
        saveFile(repo, path, data.content).catch(() => {})
      } else {
        setFileContent('File not found in this repo.')
      }
    } catch {
      setFileContent('Could not load file.')
    }
    setLoadingFile(null)
  }

  return (
    <div className="mt-1.5 ml-6 bg-gray-800/80 border border-gray-700 rounded-lg p-3 text-left">
      <p className="text-[10px] font-mono text-amber-400 mb-1">{fix.description}</p>
      <p className="text-[11px] text-gray-300 mb-2 leading-relaxed">{fix.fixHint}</p>

      {fix.fileHints.length > 0 && repo && (
        <div>
          <p className="text-[9px] font-mono text-gray-600 uppercase tracking-wider mb-1.5">related files</p>
          <div className="flex flex-wrap gap-1.5">
            {fix.fileHints.map(hint => (
              <button
                key={hint}
                onClick={e => { e.stopPropagation(); viewFile(hint) }}
                disabled={loadingFile === hint}
                className="text-[9px] font-mono px-2 py-0.5 rounded border border-gray-600 text-gray-400 hover:border-emerald-600 hover:text-emerald-400 transition-colors disabled:opacity-50"
              >
                {loadingFile === hint ? 'loading…' : hint}
              </button>
            ))}
          </div>
        </div>
      )}

      {fileContent && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[9px] font-mono text-gray-600">{loadingFile || fix.fileHints[0]}</p>
            {fromCache && <span className="text-[8px] font-mono text-gray-700 bg-gray-800 px-1 rounded">cached</span>}
          </div>
          <pre className="text-[9px] font-mono text-gray-400 bg-gray-900 rounded p-2 overflow-x-auto max-h-48 leading-relaxed whitespace-pre-wrap break-all">
            {fileContent.slice(0, 3000)}{fileContent.length > 3000 ? '\n…' : ''}
          </pre>
        </div>
      )}
    </div>
  )
}

export default function ChecklistSection({ section, build, onToggle }: Props) {
  const [open, setOpen] = useState(build.section_open?.[section.id] ?? false)
  const [expandedFix, setExpandedFix] = useState<string | null>(null)

  const counts = section.items.reduce(
    (acc, item) => {
      const s = getItemState(build, section.id, item.id)
      if (s === 'auto' || s === 'manual') acc.done++
      if (s === 'review') acc.review++
      acc.total++
      return acc
    },
    { done: 0, total: 0, review: 0 }
  )

  return (
    <div className="mb-1.5">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-3 py-2 bg-gray-800/60 hover:bg-gray-800 border rounded-lg text-left transition-colors ${
          counts.review > 0 && !open ? 'border-amber-500/40' : 'border-gray-700'
        }`}
      >
        <span className="text-sm">{section.icon}</span>
        <span className="text-xs font-semibold flex-1 text-gray-200">{section.title}</span>
        {counts.review > 0 && !open && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            ⚠ {counts.review}
          </span>
        )}
        <span className="text-[10px] font-mono text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded-full border border-gray-700">
          {counts.done}/{counts.total}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 12 12" fill="none"
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="pt-0.5">
          {section.items.map(item => {
            const state = getItemState(build, section.id, item.id)
            const done = state === 'auto' || state === 'manual'
            const clickable = state !== 'auto'
            const signalKey = item.auto || item.autoSignal ? (item.auto ?? '') : ''
            const hasFix = !done && signalKey && SIGNAL_FIXES[signalKey]
            const fixId = `${section.id}:${item.id}`
            const fixOpen = expandedFix === fixId

            return (
              <div key={item.id}>
                <div
                  onClick={() => {
                    if (hasFix) {
                      setExpandedFix(fixOpen ? null : fixId)
                    } else if (clickable) {
                      onToggle(section.id, item.id)
                    }
                  }}
                  className={`flex items-start gap-2.5 px-3 py-1.5 rounded-md transition-colors ${
                    clickable ? 'cursor-pointer hover:bg-gray-800/50' : 'cursor-default'
                  }`}
                >
                  <Checkbox state={state} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs leading-relaxed flex items-center gap-1 flex-wrap ${done ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                      {item.l}
                      <span className={`text-[9px] font-mono px-1 py-0.5 rounded-full no-underline ${TAG_COLORS[item.tag] ?? ''}`}>
                        {item.tag}
                      </span>
                      {state === 'auto' && (
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 no-underline">
                          ✓ auto
                        </span>
                      )}
                      {state === 'review' && (
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 no-underline">
                          ⚠ review
                        </span>
                      )}
                      {hasFix && (
                        <span className="text-[9px] font-mono text-gray-600 ml-auto">
                          {fixOpen ? '▾ fix' : '▸ fix'}
                        </span>
                      )}
                    </div>
                    {item.s && !done && (
                      <div className="text-[10px] font-mono text-gray-600 mt-0.5">{item.s}</div>
                    )}
                    {state === 'auto' && item.autoSignal && (
                      <div className="text-[10px] font-mono text-emerald-600 mt-0.5">↳ {item.autoSignal}</div>
                    )}
                    {state === 'review' && item.autoSignal && (
                      <div className="text-[10px] font-mono text-amber-600 mt-0.5">↳ {item.autoSignal}</div>
                    )}
                  </div>
                </div>

                {fixOpen && hasFix && (
                  <FixPanel signalKey={signalKey} repo={build.repo} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
