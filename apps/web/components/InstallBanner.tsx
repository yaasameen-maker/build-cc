'use client'
import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

export default function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!prompt || dismissed) return null

  return (
    <div className="mt-4 w-80 bg-gray-900 border border-gray-700 rounded-xl p-4 text-center">
      <p className="text-xs text-gray-400 mb-3">Install build.cc as an app for quick access</p>
      <div className="flex gap-2">
        <button
          onClick={() => { prompt.prompt(); setDismissed(true) }}
          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono px-3 py-2 rounded-lg transition-colors"
        >
          ↓ Add to Home Screen
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-600 hover:text-gray-400 text-xs font-mono px-2 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
