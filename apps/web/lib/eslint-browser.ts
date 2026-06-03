// Client-side code analysis — runs in the browser, no server needed.
// Mirrors the Python scanner patterns so results are consistent.
// Works offline after the JS bundle is cached by the service worker.

export interface BrowserFinding {
  filename: string
  line: number
  severity: 'error' | 'warning' | 'info'
  category: string
  message: string
  snippet: string
}

const JS_TS_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']
const PY_EXTENSIONS = ['.py']

interface LinePattern {
  regex: RegExp
  severity: 'error' | 'warning' | 'info'
  category: string
  message: string
}

const LINE_PATTERNS: LinePattern[] = [
  // Security
  { regex: /(?:password|passwd|secret|api_key|apikey|auth_token|access_token)\s*=\s*["'][^"']{6,}["']/i, severity: 'error', category: 'security', message: 'Possible hardcoded secret' },
  { regex: /Bearer\s+[a-z0-9\-_.]{20,}/i, severity: 'error', category: 'security', message: 'Possible hardcoded Bearer token' },
  { regex: /["'](?:sk|pk|rk)[-_][a-z0-9]{20,}["']/i, severity: 'error', category: 'security', message: 'Possible API key literal' },
  { regex: /eval\s*\(/, severity: 'error', category: 'security', message: 'eval() usage — potential code injection' },
  { regex: /dangerouslySetInnerHTML/, severity: 'warning', category: 'security', message: 'dangerouslySetInnerHTML — XSS risk if unsanitized' },
  { regex: /exec\s*\(/, severity: 'warning', category: 'security', message: 'exec() usage — review carefully' },

  // Quality — JS/TS
  { regex: /\bconsole\.log\s*\(/, severity: 'warning', category: 'quality', message: 'console.log left in code' },
  { regex: /\bdebugger\b/, severity: 'error', category: 'quality', message: 'debugger statement left in code' },
  { regex: /\/\/\s*eslint-disable/, severity: 'info', category: 'quality', message: 'ESLint disable comment' },
  { regex: /any\s*[;,)\]>]/, severity: 'info', category: 'quality', message: 'TypeScript any type — consider a specific type' },

  // Quality — Python
  { regex: /\bprint\s*\(/, severity: 'info', category: 'quality', message: 'print() statement — check if intentional in production' },
  { regex: /\bpdb\.set_trace\(\)|\bbreakpoint\(\)/, severity: 'error', category: 'quality', message: 'Debugger breakpoint left in code' },
  { regex: /#\s*noqa\b/, severity: 'info', category: 'quality', message: 'Lint suppression (noqa)' },

  // Code smell
  { regex: /#\s*(?:TODO|FIXME|HACK|XXX)\b/, severity: 'info', category: 'smell', message: 'TODO/FIXME/HACK comment' },
  { regex: /\/\/\s*(?:TODO|FIXME|HACK|XXX)\b/, severity: 'info', category: 'smell', message: 'TODO/FIXME/HACK comment' },
]

export function analyzeContent(filename: string, content: string, maxFindings = 50): BrowserFinding[] {
  const findings: BrowserFinding[] = []
  const lines = content.split('\n')
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  const isJsTs = JS_TS_EXTENSIONS.includes(ext)
  const isPy = PY_EXTENSIONS.includes(ext)

  if (!isJsTs && !isPy && ext !== '.sh' && ext !== '.env') return []

  // File-level: complexity proxy
  if (lines.length > 500) {
    findings.push({
      filename, line: 1, severity: 'info', category: 'complexity',
      message: `File is ${lines.length} lines — consider splitting`,
      snippet: `(${lines.length} total lines)`,
    })
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const stripped = line.trim()
    if (!stripped) continue

    for (const pattern of LINE_PATTERNS) {
      if (pattern.regex.test(line)) {
        findings.push({
          filename,
          line: i + 1,
          severity: pattern.severity,
          category: pattern.category,
          message: pattern.message,
          snippet: stripped.slice(0, 120),
        })
        break
      }
    }

    if (findings.length >= maxFindings) break
  }

  return findings
}

export function summarizeFindings(findings: BrowserFinding[]) {
  const errors = findings.filter(f => f.severity === 'error').length
  const warnings = findings.filter(f => f.severity === 'warning').length
  const info = findings.filter(f => f.severity === 'info').length
  const score = Math.max(0, 100 - errors * 15 - warnings * 5 - info * 1)
  return { total: findings.length, errors, warnings, info, score }
}
