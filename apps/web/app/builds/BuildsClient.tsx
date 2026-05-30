'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Build } from '@/lib/types'
import type { User } from '@supabase/supabase-js'
import { EMPTY_DEP } from '@/lib/types'

interface Props {
  initialBuilds: Build[]
  user: User
}

export default function BuildsClient({ initialBuilds, user }: Props) {
  const [builds, setBuilds] = useState<Build[]>(initialBuilds)
  const [showNew, setShowNew] = useState(false)
  const [name, setName] = useState('')
  const [repo, setRepo] = useState('')
  const supabase = createClient()

  async function createBuild() {
    if (!name.trim()) return
    const { data, error } = await supabase
      .from('builds')
      .insert({
        user_id: user.id,
        name: name.trim(),
        repo: repo.trim() || null,
        checks: {},
        auto_checks: {},
        custom_items: {},
        docs: [],
        section_open: {},
        gh_data: { commits: [], prs: [], issues: [] },
        signals: {},
        dep: EMPTY_DEP,
        last_scan: null,
      })
      .select()
      .single()

    if (data && !error) {
      setBuilds([data as Build, ...builds])
      setName('')
      setRepo('')
      setShowNew(false)
    }
  }

  async function deleteBuild(id: string) {
    if (!confirm('Remove this build?')) return
    await supabase.from('builds').delete().eq('id', id)
    setBuilds(builds.filter(b => b.id !== id))
  }

  function progress(build: Build) {
    let done = 0, total = 0
    Object.keys(build.checks ?? {}).forEach(k => { total++; if (build.checks[k]) done++ })
    Object.keys(build.auto_checks ?? {}).filter(k => k.startsWith('auto:')).forEach(() => { total++; done++ })
    return total ? Math.round(done / total * 100) : 0
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center gap-3">
        <span className="font-bold text-base tracking-tight">
          build<span className="text-emerald-400">.</span>cc
        </span>
        <span className="text-gray-600 text-sm ml-auto font-mono">{user.user_metadata?.user_name}</span>
        <button
          onClick={async () => { await createClient().auth.signOut(); location.href = '/auth/signin' }}
          className="text-gray-500 hover:text-gray-300 text-xs font-mono transition-colors"
        >
          sign out
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-sm font-mono text-gray-400 uppercase tracking-widest">builds</h1>
          <button
            onClick={() => setShowNew(true)}
            className="text-xs font-mono px-3 py-1.5 rounded-md border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          >
            + new build
          </button>
        </div>

        {showNew && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-5">
            <div className="text-sm font-semibold mb-3">new build</div>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono mb-2 placeholder-gray-600 focus:outline-none focus:border-gray-500"
              placeholder="build name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createBuild()}
              autoFocus
            />
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono mb-3 placeholder-gray-600 focus:outline-none focus:border-gray-500"
              placeholder="github repo (owner/repo) optional"
              value={repo}
              onChange={e => setRepo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createBuild()}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNew(false)} className="text-xs font-mono px-3 py-1.5 text-gray-400 hover:text-gray-200">cancel</button>
              <button onClick={createBuild} className="text-xs font-mono px-3 py-1.5 rounded-md border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10">create</button>
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
                        className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  {autoCount > 0 && (
                    <div className="text-xs text-gray-600 font-mono mt-2">{autoCount} auto-verified</div>
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
