import sql from '@/lib/db'

export async function getGitHubAccessToken(userId: string) {
  const [account] = await sql`
    SELECT access_token, expires_at, refresh_token, scope
    FROM accounts
    WHERE "userId" = ${userId}
      AND provider = 'github'
    ORDER BY id DESC
    LIMIT 1
  `
  return account ?? null
}
