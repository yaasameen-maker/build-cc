export type LanguageCategory = 'frontend' | 'backend' | 'scripting' | 'data' | 'mobile' | 'systems' | 'infra' | 'docs'
export type LanguageRuntime = 'browser' | 'node' | 'python' | 'shell' | 'windows' | 'database' | 'cross-platform' | 'compiled' | 'none'

export type LanguageDefinition = {
  id: string
  name: string
  category: LanguageCategory
  runtime: LanguageRuntime
  bestUsedFor: string
  fileExtensions: string[]
  offlineCapable: boolean
  popular: boolean
  promptExamples: string[]
}

export const LANGUAGES: LanguageDefinition[] = [
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'frontend',
    runtime: 'node',
    bestUsedFor: 'Typed web apps, Next.js tools, and automation scripts.',
    fileExtensions: ['.ts', '.tsx'],
    offlineCapable: true,
    popular: true,
    promptExamples: [
      'Generate a TypeScript script to validate deployment environment variables.',
      'Generate a TS utility to inspect checklist completeness.',
    ],
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    category: 'frontend',
    runtime: 'browser',
    bestUsedFor: 'Interactive UI logic, browser scripts, and Node utilities.',
    fileExtensions: ['.js', '.jsx', '.mjs', '.cjs'],
    offlineCapable: true,
    popular: true,
    promptExamples: [
      'Generate a JavaScript script to parse a JSON export and summarize risks.',
    ],
  },
  {
    id: 'python',
    name: 'Python',
    category: 'backend',
    runtime: 'python',
    bestUsedFor: 'APIs, data processing, file automation, and AI workflows.',
    fileExtensions: ['.py'],
    offlineCapable: true,
    popular: true,
    promptExamples: [
      'Generate a Python script to scan a folder and report missing env vars.',
    ],
  },
  {
    id: 'bash',
    name: 'Bash',
    category: 'scripting',
    runtime: 'shell',
    bestUsedFor: 'CLI automation, local dev setup, and deployment helpers.',
    fileExtensions: ['.sh'],
    offlineCapable: true,
    popular: true,
    promptExamples: [
      'Generate a Bash script to back up env files and print missing keys.',
    ],
  },
  {
    id: 'powershell',
    name: 'PowerShell',
    category: 'scripting',
    runtime: 'windows',
    bestUsedFor: 'Windows system automation, admin tasks, and developer tooling.',
    fileExtensions: ['.ps1'],
    offlineCapable: true,
    popular: true,
    promptExamples: [
      'Generate a PowerShell script to check local tool versions and env vars.',
    ],
  },
  {
    id: 'sql',
    name: 'SQL',
    category: 'data',
    runtime: 'database',
    bestUsedFor: 'Queries, migrations, data inspection, and schema updates.',
    fileExtensions: ['.sql'],
    offlineCapable: true,
    popular: true,
    promptExamples: [
      'Generate a SQL query to find incomplete checklist records by repo.',
    ],
  },
  {
    id: 'rust',
    name: 'Rust',
    category: 'systems',
    runtime: 'compiled',
    bestUsedFor: 'Fast CLIs, systems utilities, and safe backend tools.',
    fileExtensions: ['.rs'],
    offlineCapable: false,
    popular: true,
    promptExamples: [
      'Generate a Rust CLI that validates a config file and prints a summary.',
    ],
  },
  {
    id: 'makefile',
    name: 'Makefile',
    category: 'infra',
    runtime: 'cross-platform',
    bestUsedFor: 'Task automation and build orchestration.',
    fileExtensions: ['Makefile'],
    offlineCapable: true,
    popular: true,
    promptExamples: [
      'Generate a Makefile for local dev, lint, typecheck, and API tests.',
    ],
  },
  {
    id: 'markdown',
    name: 'Markdown',
    category: 'docs',
    runtime: 'none',
    bestUsedFor: 'Documentation, runbooks, READMEs, and prompt libraries.',
    fileExtensions: ['.md'],
    offlineCapable: true,
    popular: true,
    promptExamples: [
      'Generate a Markdown runbook for local build.cc setup.',
    ],
  },
]
