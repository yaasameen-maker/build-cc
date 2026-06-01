import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import PostgresAdapter from '@auth/pg-adapter'
import { Pool } from 'pg'

// pg Pool for the NextAuth adapter (uses DATABASE_URL)
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: { params: { scope: 'read:user user:email repo' } },
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
