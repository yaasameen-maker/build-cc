export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 text-center">
      <div className="text-2xl font-bold text-white mb-1 tracking-tight">
        build<span className="text-emerald-400">.</span>cc
      </div>
      <p className="text-gray-600 text-xs font-mono mt-1 mb-8">build pipeline command center</p>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-sm w-full">
        <div className="text-3xl mb-4">📡</div>
        <p className="text-white font-semibold mb-2">You&apos;re offline</p>
        <p className="text-gray-500 text-sm font-mono">
          Your builds are cached locally. Navigate back to a build you&apos;ve previously loaded to view it.
        </p>
        <p className="text-gray-700 text-xs font-mono mt-4">
          Any PRs you create while offline will be sent automatically when you reconnect.
        </p>
      </div>
    </div>
  )
}
