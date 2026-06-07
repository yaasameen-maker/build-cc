export type ProjectStack = {
  frontend: string[]
  backend: string[]
  database: string[]
  hosting: string[]
  auth: string[]
}

export type SignalMap = Record<string, boolean>

export function toProjectStack(signals: SignalMap): ProjectStack {
  const frontend: string[] = []
  const backend: string[] = []
  const database: string[] = []
  const hosting: string[] = []
  const auth: string[] = []

  if (signals.has_nextjs) frontend.push('Next.js')
  if (signals.has_fastapi) backend.push('FastAPI')
  if (signals.has_flask) backend.push('Flask')
  if (signals.has_django) backend.push('Django')
  if (signals.has_express) backend.push('Express')

  if (signals.has_postgres) database.push('PostgreSQL')
  if (signals.has_supabase) database.push('Supabase')
  if (signals.has_vector_db) database.push('Vector DB')

  if (signals.has_vercel) hosting.push('Vercel')
  if (signals.has_railway) hosting.push('Railway')
  if (signals.has_docker || signals.has_dockerfile) hosting.push('Docker')

  if (signals.has_auth_file) auth.push('Auth detected')

  return { frontend, backend, database, hosting, auth }
}

export function formatStackContext(stack: ProjectStack): string {
  const parts: string[] = []
  if (stack.frontend.length) parts.push(`Frontend: ${stack.frontend.join(', ')}`)
  if (stack.backend.length) parts.push(`Backend: ${stack.backend.join(', ')}`)
  if (stack.database.length) parts.push(`Database: ${stack.database.join(', ')}`)
  if (stack.hosting.length) parts.push(`Hosting: ${stack.hosting.join(', ')}`)
  if (stack.auth.length) parts.push(`Auth: ${stack.auth.join(', ')}`)
  return parts.join('\n')
}
