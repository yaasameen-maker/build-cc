import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import type { Adapter } from 'next-auth/adapters'
import sql from '@/lib/db'

function buildAdapter(): Adapter {
  return {
    async createUser(user) {
      try {
        const [row] = await sql`
          INSERT INTO users (name, email, "emailVerified", image)
          VALUES (${user.name ?? null}, ${user.email ?? null}, ${user.emailVerified ?? null}, ${user.image ?? null})
          RETURNING *`
        return row as any
      } catch (e) { console.error('[adapter] createUser failed:', e); throw e }
    },
    async getUser(id) {
      try {
        const [row] = await sql`SELECT * FROM users WHERE id = ${id}`
        return (row ?? null) as any
      } catch (e) { console.error('[adapter] getUser failed:', e); throw e }
    },
    async getUserByEmail(email) {
      try {
        const [row] = await sql`SELECT * FROM users WHERE email = ${email}`
        return (row ?? null) as any
      } catch (e) { console.error('[adapter] getUserByEmail failed:', e); throw e }
    },
    async getUserByAccount({ provider, providerAccountId }) {
      try {
        const [row] = await sql`
          SELECT u.* FROM users u
          JOIN accounts a ON a."userId" = u.id
          WHERE a.provider = ${provider} AND a."providerAccountId" = ${providerAccountId}`
        return (row ?? null) as any
      } catch (e) { console.error('[adapter] getUserByAccount failed:', e); throw e }
    },
    async updateUser(user) {
      try {
        const [row] = await sql`
          UPDATE users SET name = ${user.name ?? null}, email = ${user.email ?? null},
            "emailVerified" = ${user.emailVerified ?? null}, image = ${user.image ?? null}
          WHERE id = ${user.id!} RETURNING *`
        return row as any
      } catch (e) { console.error('[adapter] updateUser failed:', e); throw e }
    },
    async linkAccount(account) {
      try {
        await sql`
          INSERT INTO accounts ("userId", type, provider, "providerAccountId",
            refresh_token, access_token, expires_at, id_token, scope, session_state, token_type)
          VALUES (${account.userId}, ${account.type}, ${account.provider},
            ${account.providerAccountId}, ${account.refresh_token ?? null},
            ${account.access_token ?? null}, ${account.expires_at ?? null},
            ${account.id_token ?? null}, ${account.scope ?? null},
            ${(account.session_state as string | null) ?? null}, ${account.token_type ?? null})`
      } catch (e) { console.error('[adapter] linkAccount failed:', e); throw e }
    },
    async createSession({ sessionToken, userId, expires }) {
      try {
        const [row] = await sql`
          INSERT INTO sessions ("sessionToken", "userId", expires)
          VALUES (${sessionToken}, ${userId}, ${expires}) RETURNING *`
        return row as any
      } catch (e) { console.error('[adapter] createSession failed:', e); throw e }
    },
    async getSessionAndUser(sessionToken) {
      const [row] = await sql`
        SELECT s.*, u.id as uid, u.name, u.email, u."emailVerified", u.image
        FROM sessions s JOIN users u ON u.id = s."userId"
        WHERE s."sessionToken" = ${sessionToken} AND s.expires > now()`
      if (!row) return null
      const { uid, name, email, emailVerified, image, ...session } = row as any
      return { session, user: { id: uid, name, email, emailVerified, image } } as any
    },
    async updateSession({ sessionToken, expires }) {
      const [row] = await sql`
        UPDATE sessions SET expires = ${expires!}
        WHERE "sessionToken" = ${sessionToken} RETURNING *`
      return (row ?? null) as any
    },
    async deleteSession(sessionToken) {
      await sql`DELETE FROM sessions WHERE "sessionToken" = ${sessionToken}`
    },
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: buildAdapter(),
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
