import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import PostgresAdapter from '@auth/pg-adapter'
import { Pool } from 'pg'

// pg Pool for the NextAuth adapter (uses DATABASE_URL)
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  debug: true,
  logger: {
    error(code, ...message) { console.error('[auth]', code, ...message) },
    warn(code, ...message) { console.warn('[auth]', code, ...message) },
    debug(code, ...message) { console.log('[auth]', code, ...message) },
  },
  adapter: PostgresAdapter(pool),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        url: 'https://github.com/login/oauth/authorize',
        params: { scope: 'read:user user:email repo' },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
  session: { strategy: 'database' },
})
