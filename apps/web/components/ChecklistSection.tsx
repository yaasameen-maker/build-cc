'use client'

import { useState } from 'react'
import type { ChecklistSection as Section, Build, CheckState } from '@/lib/types'
import { getItemState } from '@/lib/types'
import { TAG_COLORS } from '@/lib/sections'

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

export default function ChecklistSection({ section, build, onToggle }: Props) {
  const [open, setOpen] = useState(build.section_open?.[section.id] ?? false)

  const counts = section.items.reduce(
    (acc, item) => {
      const s = getItemState(build, section.id, item.id)
      if (s === 'auto' || s === 'manual') acc.done++
      acc.total++
      return acc
    },
    { done: 0, total: 0 }
  )

  return (
    <div className="mb-1.5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-800/60 hover:bg-gray-800 border border-gray-700 rounded-lg text-left transition-colors"
      >
        <span className="text-sm">{section.icon}</span>
        <span className="text-xs font-semibold flex-1 text-gray-200">{section.title}</span>
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

            return (
              <div
                key={item.id}
                onClick={() => clickable && onToggle(section.id, item.id)}
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
            )
          })}
        </div>
      )}
    </div>
  )
}
