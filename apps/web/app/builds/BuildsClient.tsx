'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { Build } from '@/lib/types'

interface GHRepo { full_name: string; name: string; private: boolean; description: string | null; updated_at: string }

interface Props {
  initialBuilds: Build[]
  user: { id: string; name: string; image: string }
}

export default function BuildsClient({ initialBuilds, user }: Props) {
  const [builds, setBuilds] = useState<Build[]>(initialBuilds)
  const [showNew, setShowNew] = useState(false)
  const [name, setName] = useState('')
  const [repo, setRepo] = useState('')
  const [loading, setLoading] = useState(false)

  const [repos, setRepos] = useState<GHRepo[]>([])
  const [repoSearch, setRepoSearch] = useState('')
  const [repoLoading, setRepoLoading] = useState(false)
  const [showRepoList, setShowRepoList] = useState(false)
  const repoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showNew || repos.length > 0) return
    setRepoLoading(true)
    fetch('/api/repos')
      .then(r => r.json())
      .then(data => setRepos(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setRepoLoading(false))
  }, [showNew, repos.length])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (repoRef.current && !repoRef.current.contains(e.target as Node)) {
        setShowRepoList(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredRepos = repos.filter(r =>
    r.full_name.toLowerCase().includes(repoSearch.toLowerCase())
  ).slice(0, 20)

  function selectRepo(r: GHRepo) {
    setRepo(r.full_name)
    setRepoSearch(r.full_name)
    setShowRepoList(false)
    if (!name) setName(r.name)
  }

  async function createBuild() {
    if (!name.trim() || loading) return
    setLoading(true)
    const res = await fetch('/api/builds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), repo: repo.trim() }),
    })
    if (res.ok) {
      const build = await res.json()
      setBuilds([build, ...builds])
      setName('')
      setRepo('')
      setRepoSearch('')
      setShowNew(false)
    }
    setLoading(false)
  }

  async function deleteBuild(id: string) {
    if (!confirm('Remove this build?')) return
    await fetch(`/api/builds/${id}`, { method: 'DELETE' })
    setBuilds(builds.filter(b => b.id !== id))
  }

  function progress(build: Build) {
    const manual = Object.values(build.checks ?? {}).filter(Boolean).length
    const auto = Object.keys(build.auto_checks ?? {}).filter(k => k.startsWith('auto:')).length
    const total = Object.keys(build.checks ?? {}).length +
      Object.keys(build.auto_checks ?? {}).filter(k => k.startsWith('auto:')).length
    return total ? Math.round((manual + auto) / total * 100) : 0
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center gap-3">
        <span className="font-bold text-base tracking-tight">
          build<span className="text-emerald-400">.</span>cc
        </span>
        {user.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt={user.name} className="w-6 h-6 rounded-full ml-auto" />
        )}
        <span className="text-gray-500 text-xs font-mono">{user.name}</span>
        <form action="/api/auth/signout" method="POST">
          <button className="text-gray-600 hover:text-gray-400 text-xs font-mono transition-colors">sign out</button>
        </form>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xs font-mono text-gray-500 uppercase tracking-widest">builds</h1>
          <button
            onClick={() => setShowNew(true)}
            className="text-xs font-mono px-3 py-1.5 rounded-md border border-emerald-600 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          >
            + new build
          </button>
        </div>

        {showNew && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-5">
            <div className="text-sm font-semibold mb-3">new build</div>

            {/* Repo picker */}
            <div className="relative mb-2" ref={repoRef}>
              <div className="relative">
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-gray-500"
                  placeholder={repoLoading ? 'loading repos…' : 'search your GitHub repos…'}
                  value={repoSearch}
                  onChange={e => { setRepoSearch(e.target.value); setRepo(e.target.value); setShowRepoList(true) }}
                  onFocus={() => setShowRepoList(true)}
                />
                {repoSearch && (
                  <button
                    onClick={() => { setRepoSearch(''); setRepo(''); setShowRepoList(false) }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
              {showRepoList && filteredRepos.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                  {filteredRepos.map(r => (
                    <button
                      key={r.full_name}
                      onClick={() => selectRepo(r)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-700 transition-colors border-b border-gray-700/50 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-white">{r.full_name}</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${r.private ? 'bg-gray-700 text-gray-400' : 'bg-emerald-900/40 text-emerald-500'}`}>
                          {r.private ? 'private' : 'public'}
                        </span>
                      </div>
                      {r.description && (
                        <div className="text-[10px] text-gray-500 mt-0.5 truncate">{r.description}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Build name */}
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono mb-3 placeholder-gray-600 focus:outline-none focus:border-gray-500"
              placeholder="build name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createBuild()}
              autoFocus
            />

            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowNew(false); setRepoSearch(''); setRepo('') }} className="text-xs font-mono px-3 py-1.5 text-gray-500 hover:text-gray-300">cancel</button>
              <button
                onClick={createBuild}
                disabled={loading}
                className="text-xs font-mono px-3 py-1.5 rounded-md border border-emerald-600 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40"
              >
                {loading ? 'creating…' : 'create'}
              </button>
            </div>
          </div>
        )}

        {builds.length === 0 && !showNew && (
          <div className="text-center py-16 text-gray-600 font-mono text-sm">
            no builds yet — create your first one
          </div>
        )}

        <div className="flex flex-col gap-3">
          {builds.map(build => {
            const pct = progress(build)
            const autoCount = Object.keys(build.auto_checks ?? {}).filter(k => k.startsWith('auto:')).length
            return (
              <Link key={build.id} href={`/builds/${build.id}`}>
                <div className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-4 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-sm">{build.name}</div>
                      {build.repo && <div className="text-gray-500 text-xs font-mono mt-0.5">{build.repo}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-mono text-sm font-semibold">{pct}%</span>
                      <button
                        onClick={e => { e.preventDefault(); deleteBuild(build.id) }}
                        className="text-gray-700 hover:text-gray-400 text-sm transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  {autoCount > 0 && (
                    <div className="text-[10px] text-gray-600 font-mono mt-1.5">{autoCount} auto-verified</div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
