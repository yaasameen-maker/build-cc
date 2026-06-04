import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import type { Adapter } from 'next-auth/adapters'
import sql from '@/lib/db'
import { authConfig } from '@/auth.config'

function buildAdapter(): Adapter {
  return {
    async createUser(user) {
      try {
        const [row] = await sql`
          INSERT INTO users (name, email, "emailVerified", image)
          VALUES (${user.name ?? null}, ${user.email ?? null}, ${user.emailVerified ?? null}, ${user.image ?? null})
          RETURNING *`
        return row as any
      } catch (e: any) { console.error(`ERR createUser: ${e?.message} code=${e?.code}`); throw e }
    },
    async getUser(id) {
      try {
        const [row] = await sql`SELECT * FROM users WHERE id = ${id}`
        return (row ?? null) as any
      } catch (e: any) { console.error(`ERR getUser: ${e?.message} code=${e?.code}`); throw e }
    },
    async getUserByEmail(email) {
      try {
        const [row] = await sql`SELECT * FROM users WHERE email = ${email}`
        return (row ?? null) as any
      } catch (e: any) { console.error(`ERR getUserByEmail: ${e?.message} code=${e?.code}`); throw e }
    },
    async getUserByAccount({ provider, providerAccountId }) {
      try {
        const [row] = await sql`
          SELECT u.* FROM users u
          JOIN accounts a ON a."userId" = u.id
          WHERE a.provider = ${provider} AND a."providerAccountId" = ${providerAccountId}`
        return (row ?? null) as any
      } catch (e: any) { console.error(`ERR getUserByAccount: ${e?.message} code=${e?.code}`); throw e }
    },
    async updateUser(user) {
      try {
        const [row] = await sql`
          UPDATE users SET name = ${user.name ?? null}, email = ${user.email ?? null},
            "emailVerified" = ${user.emailVerified ?? null}, image = ${user.image ?? null}
          WHERE id = ${user.id!} RETURNING *`
        return row as any
      } catch (e: any) { console.error(`ERR updateUser: ${e?.message} code=${e?.code}`); throw e }
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
            ${(account.session_state as string | null) ?? null}, ${account.token_type ?? null})
          ON CONFLICT ("userId", provider, "providerAccountId")
          DO UPDATE SET
            access_token  = EXCLUDED.access_token,
            refresh_token = EXCLUDED.refresh_token,
            expires_at    = EXCLUDED.expires_at,
            scope         = EXCLUDED.scope,
            token_type    = EXCLUDED.token_type`
      } catch (e: any) { console.error(`ERR linkAccount: ${e?.message} code=${e?.code}`); throw e }
    },
    async createSession({ sessionToken, userId }) {
      try {
        const { cookies } = await import('next/headers')
        const jar = await cookies()
        const remember = jar.get('bcc-remember')?.value
        const expiry = remember === '0'
          ? new Date(Date.now() + 24 * 60 * 60 * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        const [row] = await sql`
          INSERT INTO sessions ("sessionToken", "userId", expires)
          VALUES (${sessionToken}, ${userId}, ${expiry}) RETURNING *`
        return row as any
      } catch (e: any) { console.error(`ERR createSession: ${e?.message} code=${e?.code}`); throw e }
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
  ...authConfig,
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
    ...authConfig.callbacks,
    async session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
  session: { strategy: 'database' },
})
