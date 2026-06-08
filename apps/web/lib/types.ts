export type CheckState = 'unchecked' | 'manual' | 'auto' | 'review'

export interface ChecklistItem {
  id: string
  l: string
  tag: string
  s?: string
  auto?: string
  autoWarn?: string
  autoSignal?: string
}

export interface ChecklistSection {
  id: string
  icon: string
  title: string
  items: ChecklistItem[]
}

export interface GHCommit {
  sha: string
  commit: { message: string; author: { name: string; date: string } }
}

export interface GHPR {
  number: number
  title: string
  user: { login: string }
  created_at: string
}

export interface GHIssue {
  number: number
  title: string
  created_at: string
}

export interface GHData {
  commits: GHCommit[]
  prs: GHPR[]
  issues: GHIssue[]
}

export interface DeployConfig {
  aioPlatform: string
  aioUrl: string
  aioDashUrl: string
  fePlatform: string
  feUrl: string
  feStagingUrl: string
  feDashUrl: string
  bePlatform: string
  beUrl: string
  beStagingUrl: string
  beDashUrl: string
}

export type SignalMap = Record<string, boolean>
export type AutoChecks = Record<string, boolean>
export type ManualChecks = Record<string, boolean>
export type CustomItems = Record<string, { id: string; label: string }[]>

export interface Build {
  id: string
  user_id: string
  name: string
  repo: string | null
  lang: string | null
  description: string | null
  checks: ManualChecks
  auto_checks: AutoChecks
  custom_items: CustomItems
  docs: { name: string; url?: string; version?: string; date?: string }[]
  section_open: Record<string, boolean>
  gh_data: GHData
  signals: SignalMap
  dep: DeployConfig
  last_scan: string | null
  created_at: string
  updated_at: string
}

export interface SyncResponse {
  signals: SignalMap
  auto_checks: AutoChecks
  gh_data: GHData
  file_count: number
  deploy_urls?: Record<string, string>
}

export function getItemState(build: Build, secId: string, itemId: string): CheckState {
  const autoKey = `auto:${secId}:${itemId}`
  const reviewKey = `review:${secId}:${itemId}`
  const manualKey = `${secId}:${itemId}`
  if (build.auto_checks?.[autoKey]) return 'auto'
  if (build.auto_checks?.[reviewKey]) return 'review'
  if (build.checks?.[manualKey]) return 'manual'
  return 'unchecked'
}

export const EMPTY_DEP: DeployConfig = {
  aioPlatform: '', aioUrl: '', aioDashUrl: '',
  fePlatform: '', feUrl: '', feStagingUrl: '', feDashUrl: '',
  bePlatform: '', beUrl: '', beStagingUrl: '', beDashUrl: '',
}
