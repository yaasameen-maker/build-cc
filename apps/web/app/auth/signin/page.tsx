import { signIn } from '@/lib/auth'
import { cookies } from 'next/headers'
import Link from 'next/link'
import InstallBanner from '@/components/InstallBanner'

async function signInAll(formData: FormData) {
  'use server'
  const remember = formData.get('remember') === 'on'
  const jar = await cookies()
  jar.set('bcc-remember', remember ? '1' : '0', { maxAge: 300, httpOnly: true, path: '/' })
  await signIn('github', { redirectTo: '/builds' }, { scope: 'read:user user:email repo' })
}

async function signInPublic(formData: FormData) {
  'use server'
  const remember = formData.get('remember') === 'on'
  const jar = await cookies()
  jar.set('bcc-remember', remember ? '1' : '0', { maxAge: 300, httpOnly: true, path: '/' })
  await signIn('github', { redirectTo: '/builds' }, { scope: 'read:user user:email public_repo' })
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-sm text-center">
        <Link
          href="/"
          className="flex items-center gap-1 text-gray-600 hover:text-gray-400 text-xs font-mono transition-colors mb-5 -mt-1"
        >
          ← continue without signing in
        </Link>

        <div className="text-lg font-bold text-white mb-1 tracking-tight">
          build<span className="text-emerald-400">.</span>cc
        </div>
        <p className="text-gray-400 text-sm mb-6">Build pipeline command center</p>

        {/* Single form — two buttons with different formActions */}
        <form>
          {/* All repos */}
          <button
            formAction={signInAll}
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-100 transition-colors min-h-[44px]"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Sign in — all repos
          </button>
          <p className="text-gray-600 text-[10px] font-mono mt-1.5 mb-4">public + private · <code className="text-gray-500">repo</code> scope</p>

          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-700 text-[10px] font-mono">or</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          {/* Public only */}
          <button
            formAction={signInPublic}
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg px-4 py-3 text-sm font-medium transition-colors min-h-[44px] mt-3"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Sign in — public only
          </button>
          <p className="text-gray-600 text-[10px] font-mono mt-1.5">hides private repos · <code className="text-gray-500">public_repo</code> scope</p>
          <p className="text-gray-700 text-[9px] font-mono mt-1 leading-relaxed">
            Previously used all-repos access? First{' '}
            <a
              href="https://github.com/settings/applications"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-500"
            >
              revoke this app in GitHub settings
            </a>
            , then sign in here.
          </p>

          {/* Remember me — single checkbox, applies to whichever button is clicked */}
          <label className="flex items-center justify-center gap-2 mt-5 cursor-pointer group">
            <input
              type="checkbox"
              name="remember"
              value="on"
              defaultChecked
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900 cursor-pointer accent-emerald-500"
            />
            <span className="text-gray-500 text-xs group-hover:text-gray-400 transition-colors select-none">
              Remember me for 30 days
            </span>
          </label>
          <p className="text-gray-700 text-[10px] font-mono mt-1">Unchecked = 24-hour session</p>
        </form>

        <p className="text-gray-700 text-xs mt-5">
          By signing in you agree to our{' '}
          <Link href="/privacy" className="text-gray-500 hover:text-gray-300 underline transition-colors">
            Privacy Policy
          </Link>
        </p>
      </div>
      <InstallBanner />
    </div>
  )
}
