import { signIn } from '@/lib/auth'
import Link from 'next/link'
import InstallBanner from '@/components/InstallBanner'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-sm text-center">
        <div className="text-lg font-bold text-white mb-1 tracking-tight">
          build<span className="text-emerald-400">.</span>cc
        </div>
        <p className="text-gray-400 text-sm mb-6">Build pipeline command center</p>
        <form action={async () => {
          'use server'
          await signIn('github', { redirectTo: '/builds' })
        }}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 rounded-lg px-4 py-3 text-sm font-medium hover:bg-gray-100 transition-colors min-h-[44px]"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Sign in with GitHub
          </button>
        </form>
        <p className="text-gray-600 text-xs mt-4">
          Requests <code className="text-gray-500">repo</code> scope to scan repositories
        </p>
        <p className="text-gray-700 text-xs mt-2">
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
