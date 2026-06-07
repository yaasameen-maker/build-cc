'use client'

import { useMemo, useState } from 'react'
import { LANGUAGES } from '@/lib/languages'

export function LanguageCatalog() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const filtered = useMemo(() => {
    return LANGUAGES.filter(lang => {
      const matchesQuery =
        !query ||
        lang.name.toLowerCase().includes(query.toLowerCase()) ||
        lang.bestUsedFor.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = category === 'all' || lang.category === category
      return matchesQuery && matchesCategory
    })
  }, [query, category])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <input
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
          placeholder="Search languages..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select
          className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option value="all">All</option>
          <option value="frontend">Frontend</option>
          <option value="backend">Backend</option>
          <option value="scripting">Scripting</option>
          <option value="data">Data</option>
          <option value="mobile">Mobile</option>
          <option value="systems">Systems</option>
          <option value="infra">Infra</option>
          <option value="docs">Docs</option>
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map(lang => (
          <div key={lang.id} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-mono font-semibold text-white">{lang.name}</h3>
              <div className="flex gap-1.5">
                {lang.offlineCapable && (
                  <span className="rounded-full bg-violet-900/40 border border-violet-700/40 px-2 py-0.5 text-[10px] font-mono text-violet-400">
                    offline draft
                  </span>
                )}
                <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-mono text-gray-500">
                  {lang.runtime}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">{lang.bestUsedFor}</p>
            <p className="mt-2 text-[10px] font-mono text-gray-600">
              {lang.fileExtensions.join('  ')}
            </p>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="col-span-2 text-sm text-gray-600 font-mono py-4">No languages match.</p>
        )}
      </div>
    </div>
  )
}
