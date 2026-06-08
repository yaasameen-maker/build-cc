'use client'

import type { DeployConfig } from '@/lib/types'

const AIO = [
  { id: 'railway', name: 'Railway', desc: 'Frontend + Backend + DB + cron — one project, one bill', dash: 'https://railway.app/dashboard', docs: 'https://docs.railway.app' },
  { id: 'supabase', name: 'Supabase', desc: 'Postgres + Auth + Storage + Edge Functions + Realtime', dash: 'https://app.supabase.com', docs: 'https://supabase.com/docs' },
]
const FE_PLAT = [
  { id: 'vercel', name: 'Vercel', free: true, dash: 'https://vercel.com/dashboard', docs: 'https://vercel.com/docs' },
  { id: 'netlify', name: 'Netlify', free: true, dash: 'https://app.netlify.com', docs: 'https://docs.netlify.com' },
  { id: 'cloudflare', name: 'CF Pages', free: true, dash: 'https://dash.cloudflare.com', docs: 'https://developers.cloudflare.com/pages' },
  { id: 'gh-pages', name: 'GH Pages', free: true, dash: 'https://github.com', docs: 'https://docs.github.com/en/pages' },
  { id: 'render-fe', name: 'Render', free: true, dash: 'https://dashboard.render.com', docs: 'https://render.com/docs' },
]
const BE_PLAT = [
  { id: 'railway-be', name: 'Railway', free: true, dash: 'https://railway.app/dashboard', docs: 'https://docs.railway.app' },
  { id: 'render-be', name: 'Render', free: true, dash: 'https://dashboard.render.com', docs: 'https://render.com/docs' },
  { id: 'fly', name: 'Fly.io', free: true, dash: 'https://fly.io/dashboard', docs: 'https://fly.io/docs' },
  { id: 'supabase-be', name: 'Supabase', free: true, dash: 'https://app.supabase.com', docs: 'https://supabase.com/docs' },
  { id: 'heroku', name: 'Heroku', free: false, dash: 'https://dashboard.heroku.com', docs: 'https://devcenter.heroku.com' },
  { id: 'gcp', name: 'GCP Run', free: false, dash: 'https://console.cloud.google.com', docs: 'https://cloud.google.com/run/docs' },
]

function DepField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-mono text-gray-600 uppercase tracking-wide">{label}</label>
      <input
        className="bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-[10px] font-mono text-gray-200 placeholder-gray-700 focus:outline-none focus:border-gray-500 transition-colors"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function LiveLink({ url, label }: { url: string; label: string }) {
  if (!url) return null
  return (
    <a
      href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded border border-emerald-700 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
    >
      {label}
    </a>
  )
}

interface Props {
  dep: DeployConfig
  onChange: (dep: DeployConfig) => void
}

export default function DeploymentPanel({ dep, onChange }: Props) {
  function set(key: keyof DeployConfig, val: string) {
    onChange({ ...dep, [key]: val })
  }

  const aio = AIO.find(p => p.id === dep.aioPlatform)

  return (
    <div className="mb-4 space-y-2">
      {/* Deployment log header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-emerald-400 text-xs">🚀</span>
          <span className="text-sm font-semibold text-white">Deployment log</span>
        </div>
        <p className="text-[11px] font-mono text-gray-500 leading-relaxed">
          Record your live, staging, and dashboard URLs here. Once saved, you get one-click links to every environment — no bookmarks needed. Pick your platform below and paste in the URLs.
        </p>
      </div>

      {/* All-in-one */}
      <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-emerald-500 text-xs">⬡</span>
          <span className="text-xs font-semibold text-gray-200">all-in-one platforms</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">fe + be + db</span>
        </div>
        <div className="flex gap-1.5 flex-wrap mb-2">
          {AIO.map(p => (
            <button
              key={p.id}
              onClick={() => set('aioPlatform', dep.aioPlatform === p.id ? '' : p.id)}
              className={`text-[10px] font-mono px-2.5 py-1 rounded border transition-colors flex items-center gap-1.5 ${
                dep.aioPlatform === p.id
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dep.aioPlatform === p.id ? 'bg-emerald-500' : 'bg-gray-700'}`} />
              {p.name}
            </button>
          ))}
          <button className="text-[10px] font-mono px-2.5 py-1 rounded border border-gray-800 text-gray-700 cursor-default">
            none — separate platforms
          </button>
        </div>
        {aio && <div className="text-[9px] font-mono text-gray-600 mb-2">{aio.desc}</div>}
        {dep.aioPlatform && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <DepField label="dashboard URL" value={dep.aioDashUrl} placeholder={aio?.dash ?? ''} onChange={v => set('aioDashUrl', v)} />
              <DepField label="live frontend URL" value={dep.aioUrl} placeholder="https://myapp.up.railway.app" onChange={v => set('aioUrl', v)} />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <LiveLink url={dep.aioUrl} label="🚀 live site" />
              <LiveLink url={dep.aioDashUrl} label="⬡ dashboard" />
              {aio && <a href={aio.dash} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono px-2 py-1 rounded border border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors">{aio.name} ↗</a>}
            </div>
          </>
        )}
      </div>

      {/* FE + BE cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Frontend */}
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className={`w-1.5 h-1.5 rounded-full ${dep.feUrl ? 'bg-emerald-500' : 'bg-gray-700'}`} />
            <span className="text-xs font-semibold text-gray-300">frontend</span>
          </div>
          <div className="flex gap-1 flex-wrap mb-2">
            {FE_PLAT.map(p => (
              <button
                key={p.id}
                onClick={() => set('fePlatform', p.id)}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                  dep.fePlatform === p.id ? 'border-emerald-600 text-emerald-400' : 'border-gray-700 text-gray-600 hover:text-gray-400'
                }`}
              >
                {p.name}
                <span className={`ml-1 text-[7px] ${p.free ? 'text-emerald-600' : 'text-amber-600'}`}>{p.free ? 'free' : 'paid'}</span>
              </button>
            ))}
          </div>
          <div className="space-y-1.5 mb-2">
            <DepField label="live URL" value={dep.feUrl} placeholder="https://app.vercel.app" onChange={v => set('feUrl', v)} />
            <DepField label="staging URL" value={dep.feStagingUrl} placeholder="preview URL" onChange={v => set('feStagingUrl', v)} />
            <DepField label="dashboard URL" value={dep.feDashUrl} placeholder="platform dashboard" onChange={v => set('feDashUrl', v)} />
          </div>
          <div className="flex gap-1 flex-wrap">
            <LiveLink url={dep.feUrl} label="🚀 live" />
            <LiveLink url={dep.feStagingUrl} label="🧪 staging" />
            <LiveLink url={dep.feDashUrl} label="⬡ dash" />
          </div>
        </div>

        {/* Backend */}
        <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className={`w-1.5 h-1.5 rounded-full ${dep.beUrl ? 'bg-emerald-500' : 'bg-gray-700'}`} />
            <span className="text-xs font-semibold text-gray-300">backend</span>
          </div>
          <div className="flex gap-1 flex-wrap mb-2">
            {BE_PLAT.map(p => (
              <button
                key={p.id}
                onClick={() => set('bePlatform', p.id)}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                  dep.bePlatform === p.id ? 'border-emerald-600 text-emerald-400' : 'border-gray-700 text-gray-600 hover:text-gray-400'
                }`}
              >
                {p.name}
                <span className={`ml-1 text-[7px] ${p.free ? 'text-emerald-600' : 'text-amber-600'}`}>{p.free ? 'free' : 'paid'}</span>
              </button>
            ))}
          </div>
          <div className="space-y-1.5 mb-2">
            <DepField label="API URL" value={dep.beUrl} placeholder="https://api.railway.app" onChange={v => set('beUrl', v)} />
            <DepField label="staging URL" value={dep.beStagingUrl} placeholder="staging API URL" onChange={v => set('beStagingUrl', v)} />
            <DepField label="dashboard URL" value={dep.beDashUrl} placeholder="platform dashboard" onChange={v => set('beDashUrl', v)} />
          </div>
          <div className="flex gap-1 flex-wrap">
            <LiveLink url={dep.beUrl} label="⚡ API" />
            <LiveLink url={dep.beStagingUrl} label="🧪 staging" />
            <LiveLink url={dep.beDashUrl} label="⬡ dash" />
          </div>
        </div>
      </div>
    </div>
  )
}
