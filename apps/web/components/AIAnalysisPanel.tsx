'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { canEnableOfflineAI } from '@/lib/device-capability'
import { hasModelCache } from '@/lib/model-cache'
import { markReady } from '@/lib/offline-ai'

interface Props {
  issue: string
  snippet: string
}

type AIState = 'idle' | 'loading-model' | 'ready' | 'analyzing' | 'done' | 'error'

// Singleton worker shared across component instances
let sharedWorker: Worker | null = null
let modelReady = false

export default function AIAnalysisPanel({ issue, snippet }: Props) {
  const [state, setState] = useState<AIState>(modelReady ? 'ready' : 'idle')
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState('')
  const [modelCached, setModelCached] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const [error, setError] = useState('')
  const idRef = useRef(0)

  useEffect(() => {
    hasModelCache().then(setModelCached)
  }, [])

  const getWorker = useCallback(() => {
    if (!sharedWorker) {
      // Loaded from /public — not bundled by Next.js, uses importScripts from CDN
      sharedWorker = new Worker('/ai-worker.js')
    }
    return sharedWorker
  }, [])

  function loadModel() {
    setState('loading-model')
    setProgress(0)
    const worker = getWorker()
    const id = ++idRef.current

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.id !== id && e.data.type !== 'progress' && e.data.type !== 'download-progress') return
      const { type, progress: p, message } = e.data
      if (type === 'download-progress') { setCurrentFile(e.data.file ?? ''); setProgress(e.data.pct ?? 0); return }
      if (type === 'progress') { setProgress(p ?? 0); return }
      if (type === 'loaded') { modelReady = true; setModelCached(Boolean(e.data.cached)); markReady(true); setState('ready'); return }
      if (type === 'error') { setError(message); setState('error') }
    }

    worker.postMessage({ type: 'load', id })
  }

  function analyze() {
    if (!modelReady) return
    setState('analyzing')
    setSuggestion('')
    const worker = getWorker()
    const id = ++idRef.current

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.id !== id) return
      const { type, text, message } = e.data
      if (type === 'result') { setSuggestion(text); setState('done'); return }
      if (type === 'error') { setError(message); setState('error') }
    }

    worker.postMessage({ type: 'analyze', id, payload: { issue, snippet: snippet.slice(0, 400) } })
  }

  if (state === 'idle') {
    const capable = canEnableOfflineAI()
    return (
      <div className="mt-2 pt-2 border-t border-gray-700">
        <p className="text-[9px] font-mono text-gray-600 mb-1.5">
          {modelCached
            ? 'AI analysis — model cached, lightweight offline mode available'
            : 'AI analysis — downloads once, then supports lightweight offline tasks'}
        </p>
        {capable ? (
          <button
            onClick={loadModel}
            className="text-[9px] font-mono px-2.5 py-1 rounded border border-violet-700 text-violet-400 hover:bg-violet-500/10 transition-colors"
          >
            {modelCached ? '✦ load cached model' : '⬇ enable AI analysis'}
          </button>
        ) : (
          <p className="text-[9px] font-mono text-gray-700">
            not available on this device or connection
          </p>
        )}
      </div>
    )
  }

  if (state === 'loading-model') return (
    <div className="mt-2 pt-2 border-t border-gray-700">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[9px] font-mono text-gray-600 flex-shrink-0">
          {progress > 0 ? `${progress}%` : 'starting…'}
        </span>
      </div>
      {currentFile ? (
        <p className="text-[9px] font-mono text-gray-700 mt-1 truncate">{currentFile}</p>
      ) : (
        <p className="text-[9px] font-mono text-gray-700 mt-1">downloading model — cached after this</p>
      )}
    </div>
  )

  if (state === 'error') return (
    <div className="mt-2 pt-2 border-t border-gray-700">
      <p className="text-[9px] font-mono text-red-400">{error || 'AI analysis failed'}</p>
    </div>
  )

  if (state === 'ready') return (
    <div className="mt-2 pt-2 border-t border-gray-700">
      <button
        onClick={analyze}
        className="text-[9px] font-mono px-2.5 py-1 rounded border border-violet-700 text-violet-400 hover:bg-violet-500/10 transition-colors"
      >
        ✦ get AI suggestion
      </button>
    </div>
  )

  if (state === 'analyzing') return (
    <div className="mt-2 pt-2 border-t border-gray-700">
      <p className="text-[9px] font-mono text-gray-600 animate-pulse">thinking…</p>
    </div>
  )

  return (
    <div className="mt-2 pt-2 border-t border-gray-700">
      <p className="text-[9px] font-mono text-violet-400 mb-1">✦ AI suggestion</p>
      <p className="text-[11px] text-gray-300 leading-relaxed">{suggestion}</p>
      <button
        onClick={() => setState('ready')}
        className="text-[9px] font-mono text-gray-700 hover:text-gray-500 mt-1 transition-colors"
      >
        retry
      </button>
    </div>
  )
}
