'use client'

import { useMemo, useState } from 'react'
import { LANGUAGES } from '@/lib/languages'
import { generateTemplateDraft } from '@/lib/script-templates'
import { formatStackContext, type ProjectStack } from '@/lib/project-stack'
import { getAIWorker, useOfflineAIReady } from '@/lib/offline-ai'
import { copyToClipboard, downloadTextFile } from '@/lib/downloads'

type Props = { stack: ProjectStack }

type GenerationResult = { filename: string; content: string; notes: string[] }

export function ScriptGeneratorPanel({ stack }: Props) {
  const [languageId, setLanguageId] = useState('python')
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState<'offline' | 'online'>('offline')
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [generating, setGenerating] = useState(false)

  const offlineReady = useOfflineAIReady()

  const language = useMemo(
    () => LANGUAGES.find(x => x.id === languageId) ?? LANGUAGES[0],
    [languageId]
  )

  async function onGenerate() {
    if (!prompt.trim()) return
    setGenerating(true)
    setResult(null)

    try {
      if (mode === 'offline') {
        const worker = offlineReady && language.offlineCapable ? getAIWorker() : null

        if (worker) {
          const id = crypto.randomUUID()
          await new Promise<void>(resolve => {
            const handler = (e: MessageEvent) => {
              if (e.data?.type === 'generated' && e.data.id === id) {
                setResult({
                  filename: `generated${language.fileExtensions[0] ?? '.txt'}`,
                  content: e.data.text,
                  notes: ['Generated offline using the cached model.'],
                })
                worker.removeEventListener('message', handler)
                resolve()
              }
            }
            worker.addEventListener('message', handler)
            worker.postMessage({
              type: 'generate',
              id,
              payload: { prompt, language: language.name, stackSummary: formatStackContext(stack) },
            })
          })
        } else {
          setResult(generateTemplateDraft({ language, prompt, stack, mode: 'offline' }))
        }
        return
      }

      const res = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ languageId: language.id, prompt, stack }),
      })
      const data = await res.json()
      setResult(data)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <select
          className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-xs font-mono text-white focus:outline-none"
          value={languageId}
          onChange={e => setLanguageId(e.target.value)}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.id} value={lang.id}>{lang.name}</option>
          ))}
        </select>

        <select
          className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-xs font-mono text-white focus:outline-none"
          value={mode}
          onChange={e => setMode(e.target.value as 'offline' | 'online')}
        >
          <option
            value="offline"
            disabled={!language.offlineCapable}
          >
            {offlineReady && language.offlineCapable ? 'Offline (model ready)' : 'Offline draft (template)'}
          </option>
          <option value="online">Online enhanced</option>
        </select>

        <button
          onClick={onGenerate}
          disabled={generating || !prompt.trim()}
          className="rounded border border-emerald-600 px-3 py-2 text-xs font-mono text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {generating ? 'generating…' : '✦ generate'}
        </button>
      </div>

      <textarea
        className="w-full min-h-[80px] rounded border border-gray-700 bg-gray-900 px-3 py-2 text-xs font-mono text-white placeholder-gray-600 focus:outline-none resize-none"
        placeholder="Describe the script you want…"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
      />

      {result && (
        <div className="rounded border border-gray-700 bg-gray-900/50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
            <span className="text-[10px] font-mono text-gray-500">{result.filename}</span>
            <div className="flex gap-2">
              <button
                onClick={() => downloadTextFile(result.filename, result.content)}
                className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-600 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                ↓ download
              </button>
              <button
                onClick={() => copyToClipboard(result.content)}
                className="text-[10px] font-mono px-2 py-0.5 rounded border border-gray-600 text-gray-400 hover:bg-gray-700 transition-colors"
              >
                ⎘ copy
              </button>
            </div>
          </div>
          <pre className="overflow-x-auto px-3 py-2 text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap">{result.content}</pre>
          {result.notes.length > 0 && (
            <ul className="px-3 py-2 border-t border-gray-700 space-y-0.5">
              {result.notes.map(note => (
                <li key={note} className="text-[10px] font-mono text-gray-600">↳ {note}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
