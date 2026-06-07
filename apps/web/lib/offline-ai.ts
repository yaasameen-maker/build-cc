'use client'

import { useEffect, useState } from 'react'
import { canEnableOfflineAI } from '@/lib/device-capability'

let worker: Worker | null = null
let ready = false
const listeners = new Set<(ready: boolean) => void>()

export function getAIWorker(): Worker | null {
  if (!worker && typeof window !== 'undefined') {
    worker = new Worker('/ai-worker.js')
  }
  return worker
}

export function markReady(value: boolean) {
  ready = value
  listeners.forEach(fn => fn(ready))
}

export function useOfflineAIReady(): boolean {
  const [state, setState] = useState(false)

  useEffect(() => {
    if (!canEnableOfflineAI()) return

    setState(ready)
    const listener = (value: boolean) => setState(value)
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  return state
}
