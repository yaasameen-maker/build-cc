'use client'

import { useCallback, useEffect, useState } from 'react'
import type { ProjectStack } from '@/lib/project-stack'
import { ScriptGeneratorPanel } from '@/components/scripts/ScriptGeneratorPanel'
import { copyToClipboard, downloadTextFile } from '@/lib/downloads'

type ScriptsView = 'library' | 'generator'

type SavedScript = {
  id: string
  language_id: string
  filename_suggestion: string | null
  prompt: string
  mode: string
  content: string
  created_at: string
}

export default function AgentScripts({ stack, repoFullName }: { stack: ProjectStack; repoFullName?: string }) {
  const [view, setView] = useState<ScriptsView>('generator')
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([])
  const [loading, setLoading] = useState(false)

  const loadScripts = useCallback(async () => {
    setLoading(true)
    try {
      const params = repoFullName ? `?repo=${encodeURIComponent(repoFullName)}` : ''
      const res = await fetch(`/api/generated-scripts${params}`)
      if (res.ok) setSavedScripts(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }, [repoFullName])

  useEffect(() => {
    loadScripts()
  }, [loadScripts])

  function handleViewChange(v: ScriptsView) {
    setView(v)
    if (v === 'library') loadScripts()
  }

  const activeClass = 'border-emerald-500 text-emerald-400'
  const idleClass = 'border-transparent text-gray-500 hover:text-gray-300'

  return (
    <div className="space-y-3">
      <div className="flex gap-0 border-b border-gray-800">
        {(['generator', 'library'] as const).map(v => (
          <button
            key={v}
            onClick={() => handleViewChange(v)}
            className={`text-[11px] font-mono px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${view === v ? activeClass : idleClass}`}
          >
            {v === 'library' ? 'script library' : 'script generator'}
          </button>
        ))}
      </div>

      {view === 'library' && (
        <div className="space-y-2">
          {loading && (
            <div className="text-[10px] font-mono text-gray-600 py-4 text-center">loading…</div>
          )}

          {!loading && savedScripts.length === 0 && (
            <div className="text-center py-8 border border-dashed border-gray-800 rounded-xl">
              <div className="text-[11px] font-mono text-gray-600">No saved scripts yet.</div>
              <div className="text-[10px] font-mono text-gray-700 mt-1">Generate a script and save it to build your library.</div>
            </div>
          )}

          {!loading && savedScripts.map(s => {
            const filename = s.filename_suggestion ?? `generated.${s.language_id}`
            return (
              <div key={s.id} className="bg-gray-800/40 border border-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-500">{s.language_id}</span>
                  <span className="text-[11px] font-semibold font-mono text-gray-200 truncate flex-1">{filename}</span>
                  <span className="text-[9px] font-mono text-gray-700 flex-shrink-0">{s.mode}</span>
                </div>
                <div className="text-[10px] font-mono text-gray-500 mb-3 leading-relaxed truncate">{s.prompt}</div>
                <div className="flex gap-1.5 items-center">
                  <button
                    onClick={() => downloadTextFile(filename, s.content)}
                    className="text-[10px] font-mono px-2.5 py-1 rounded border border-emerald-600 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    ↓ download
                  </button>
                  <button
                    onClick={() => copyToClipboard(s.content)}
                    className="text-[10px] font-mono px-2.5 py-1 rounded border border-gray-600 text-gray-400 hover:bg-gray-700 transition-colors"
                  >
                    ⎘ copy
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {view === 'generator' && (
        <ScriptGeneratorPanel
          stack={stack}
          repoFullName={repoFullName}
          onScriptSaved={loadScripts}
        />
      )}
    </div>
  )
}
