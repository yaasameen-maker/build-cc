export function canEnableOfflineAI(): boolean {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean }
  }).connection

  if (memory < 4) return false
  if (connection?.saveData) return false
  return true
}
