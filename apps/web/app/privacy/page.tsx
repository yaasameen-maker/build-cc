import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — build.cc',
}


export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center gap-3">
        <Link href="/builds" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">←</Link>
        <span className="font-bold text-base tracking-tight">
          build<span className="text-emerald-400">.</span>cc
        </span>
        <span className="text-gray-600 text-xs font-mono">/ privacy policy</span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-1">Privacy Policy</h1>
          <p className="text-xs font-mono text-gray-500">Last updated June 2, 2026</p>
        </div>

        <div className="space-y-8 text-sm text-gray-300 leading-relaxed">

          {/* Who we are */}
          <section>
            <h2 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-3">Who we are</h2>
            <p>build.cc is a build pipeline command center for developers and technical founders, operated by Yaasameen Perez.</p>
            <p className="mt-2">Questions? Email <a href="mailto:yaasameen.perez@pursuit.org" className="text-emerald-400 hover:underline">yaasameen.perez@pursuit.org</a></p>
          </section>

          {/* What we collect */}
          <section>
            <h2 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-3">What we collect and why</h2>

            <p className="font-medium text-white mb-2">When you sign in</p>
            <p className="mb-3">Sign-in is handled through GitHub OAuth. When you authenticate, GitHub shares the following, which we store in our database:</p>
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden mb-4">
              {[
                ['Name', 'Displayed in the app navigation'],
                ['Email address', 'Used as your account identifier'],
                ['GitHub avatar URL', 'Displayed in the app navigation'],
                ['GitHub user ID', 'Links your account to your builds'],
                ['OAuth access token', 'Used to read your repos when you run a sync'],
              ].map(([data, use]) => (
                <div key={data} className="flex gap-4 px-4 py-2.5 border-b border-gray-800 last:border-0">
                  <span className="font-mono text-[11px] text-gray-300 w-44 flex-shrink-0">{data}</span>
                  <span className="text-[11px] text-gray-500">{use}</span>
                </div>
              ))}
            </div>

            <p className="font-medium text-white mb-2">GitHub OAuth scope</p>
            <p className="mb-3">
              The app requests the <code className="text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded text-xs">repo</code> scope.
              This grants read and write access to your repositories. We use it <strong className="text-white">read-only</strong> — to scan file trees and fetch activity. We never write to, modify, or delete anything in your repositories.
            </p>

            <p className="font-medium text-white mb-2">When you run a sync</p>
            <p className="mb-3">Clicking sync triggers a scan of your linked repository. Here is exactly what happens:</p>
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              {[
                ['File path list', 'No — processed in memory, then discarded'],
                ['package.json content', 'No — read to detect dependencies, then discarded'],
                ['requirements.txt content', 'No — same as above'],
                ['.github/workflows content', 'No — same as above'],
                ['Last 15 commit messages + authors', 'Yes — shown in the GitHub tab'],
                ['Up to 5 open PR titles + authors', 'Yes — shown in the GitHub tab'],
                ['Up to 5 open issue titles', 'Yes — shown in the GitHub tab'],
                ['Detected tech stack signals', 'Yes — used to auto-verify checklist items'],
              ].map(([data, stored]) => (
                <div key={data} className="flex gap-4 px-4 py-2.5 border-b border-gray-800 last:border-0">
                  <span className="font-mono text-[11px] text-gray-300 w-52 flex-shrink-0">{data}</span>
                  <span className={`text-[11px] ${stored.startsWith('No') ? 'text-gray-600' : 'text-amber-400'}`}>{stored}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-600">We never read, store, or transmit your source code, secret files, or any file content beyond the dependency and workflow files listed above.</p>
          </section>

          {/* What we don't do */}
          <section>
            <h2 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-3">What we do not do</h2>
            <ul className="space-y-1.5">
              {[
                'We do not sell your data to anyone.',
                'We do not use your data for advertising.',
                'We do not include any third-party analytics or tracking scripts.',
                'We do not write to, modify, or delete your GitHub repositories.',
                'We do not share your data with any party other than the infrastructure providers listed below.',
              ].map(item => (
                <li key={item} className="flex gap-2 text-[13px]">
                  <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Infrastructure */}
          <section>
            <h2 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-3">Infrastructure</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              {[
                ['Railway', 'Hosts our PostgreSQL database and Python API. Your data is stored in Railway\'s infrastructure.'],
                ['Vercel', 'Hosts the web application. Processes requests but does not persistently store your data.'],
                ['GitHub', 'OAuth provider and repository data source.'],
              ].map(([service, desc]) => (
                <div key={service} className="flex gap-4 px-4 py-2.5 border-b border-gray-800 last:border-0">
                  <span className="font-mono text-[11px] text-white w-24 flex-shrink-0">{service}</span>
                  <span className="text-[11px] text-gray-500">{desc}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-600">Railway and Vercel are both SOC 2 compliant providers.</p>
          </section>

          {/* Data deletion */}
          <section>
            <h2 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-3">Data deletion</h2>
            <p className="mb-2"><strong className="text-white">Builds:</strong> You can delete any build at any time from the builds list. This permanently removes all associated checklist data, signals, and GitHub activity.</p>
            <p className="mb-2"><strong className="text-white">Account:</strong> To delete your account and all stored data, email <a href="mailto:yaasameen.perez@pursuit.org" className="text-emerald-400 hover:underline">yaasameen.perez@pursuit.org</a> with subject line "Account deletion request." We will delete your data within 7 days and confirm by reply.</p>
            <p>You can also revoke build.cc's GitHub access at any time from <a href="https://github.com/settings/applications" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">GitHub's authorized apps page</a>. This prevents future syncs but does not delete data already stored.</p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-3">Changes to this policy</h2>
            <p>If we make material changes to what data we collect or how we use it, we will update the date at the top of this document. Continued use of the app after changes constitutes acceptance of the updated policy.</p>
          </section>

          {/* Contact */}
          <section className="border-t border-gray-800 pt-6">
            <p className="text-xs font-mono text-gray-600">Privacy questions or requests: <a href="mailto:yaasameen.perez@pursuit.org" className="text-emerald-400 hover:underline">yaasameen.perez@pursuit.org</a></p>
          </section>

        </div>
      </div>
    </div>
  )
}
