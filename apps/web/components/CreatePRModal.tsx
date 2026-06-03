'use client'

import { useState } from 'react'
import { enqueuePR } from '@/lib/idb'

interface Props {
  repo: string
  branches: string[]
  defaultBase?: string
  onClose: () => void
  onCreated: (pr: { number: number; url: string; title: string }) => void
}

export default function CreatePRModal({ repo, branches, defaultBase = 'main', onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [head, setHead] = useState(branches[0] ?? '')
  const [base, setBase] = useState(defaultBase)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!title.trim() || !head || !base) return
    setLoading(true)
    setError('')

    // If offline, queue for later
    if (!navigator.onLine) {
      try {
        await enqueuePR({ repo, title: title.trim(), body, head, base, queuedAt: new Date().toISOString() })
        onCreated({ number: 0, url: '', title: title.trim() + ' (queued — will send when online)' })
        onClose()
      } catch {
        setError('Could not queue PR — try again')
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      const res = await fetch('/api/github/pulls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo, title: title.trim(), body, head, base }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create PR'); return }
      onCreated(data)
      onClose()
    } catch {
      setError('Network error — try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <div className="text-sm font-semibold text-white">Create pull request</div>
            <div className="text-[10px] font-mono text-gray-500 mt-0.5">{repo}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors text-lg leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Branch selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono text-gray-500 block mb-1">head branch</label>
              <select
                value={head}
                onChange={e => setHead(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-gray-200 focus:outline-none focus:border-emerald-500"
              >
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
                {branches.length === 0 && <option value={head}>{head || 'feature'}</option>}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-gray-500 block mb-1">base branch</label>
              <select
                value={base}
                onChange={e => setBase(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-gray-200 focus:outline-none focus:border-emerald-500"
              >
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
                {branches.length === 0 && <option value={base}>{base}</option>}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-[10px] font-mono text-gray-500 block mb-1">title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="PR title"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-[10px] font-mono text-gray-500 block mb-1">description (optional)</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="What does this PR do?"
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {error && <p className="text-xs font-mono text-red-400">{error}</p>}
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-gray-700 text-sm font-mono text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading || !title.trim() || !head || !base || head === base}
            className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 text-sm font-semibold transition-colors"
          >
            {loading ? 'Creating…' : 'Create PR'}
          </button>
        </div>
      </div>
    </div>
  )
}
