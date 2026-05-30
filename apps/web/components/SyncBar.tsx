'use client'

interface Props {
  state: 'idle' | 'scanning' | 'done' | 'error'
  message: string
  progress: number // 0–100
  onSync: () => void
}

export default function SyncBar({ state, message, progress, onSync }: Props) {
  const dotColor =
    state === 'scanning' ? 'bg-amber-500 animate-pulse' :
    state === 'done' ? 'bg-emerald-500' :
    state === 'error' ? 'bg-red-500' :
    'bg-gray-600'

  const barColor =
    state === 'done' ? 'bg-emerald-500' : 'bg-amber-500'

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2.5 bg-gray-800/60 border border-gray-700 rounded-lg mb-3">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
        <span className="text-[11px] font-mono text-gray-400 flex-1 truncate">{message}</span>
        <button
          onClick={onSync}
          disabled={state === 'scanning'}
          className="text-[10px] font-mono px-2.5 py-1 rounded border border-emerald-600 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
        >
          {state === 'scanning' ? 'scanning…' : '↻ sync + scan'}
        </button>
      </div>
      {(state === 'scanning' || state === 'done') && (
        <div className="h-0.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
