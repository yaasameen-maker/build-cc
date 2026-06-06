import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const requiredChecks = [
  'apps/web',
  'apps/api',
  'apps/web/app',
  'apps/web/components',
  'apps/web/lib',
]

const optionalChecks = [
  'src/llm/core/types.py',
  'src/llm/providers/resolver.py',
  'apps/web/public/sw.js',
  'apps/web/public/ai-worker.js',
  'supabase/migrations',
]

function exists(p: string) {
  return fs.existsSync(path.resolve(process.cwd(), p))
}

function hasBinary(cmd: string) {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const result = {
  required: requiredChecks.map(p => ({ path: p, exists: exists(p) })),
  optional: optionalChecks.map(p => ({ path: p, exists: exists(p) })),
  runtimes: {
    node: hasBinary('node'),
    pnpm: hasBinary('pnpm'),
    python: hasBinary('python'),
    claude: hasBinary('claude'),
  },
}

console.log(JSON.stringify(result, null, 2))

const missing = result.required.filter(x => !x.exists)
if (missing.length > 0) {
  console.error('\nMissing required paths:')
  missing.forEach(m => console.error('  ✗', m.path))
  process.exit(1)
} else {
  console.log('\n✓ All required paths present')
}
