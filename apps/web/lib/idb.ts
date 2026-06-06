const DB_NAME = 'build-cc'
const DB_VERSION = 3
const BUILDS_STORE = 'builds'
const PR_QUEUE_STORE = 'pr-queue'
const FILES_STORE = 'files'
const PR_REVIEWS_STORE = 'pr-reviews'
const COMMITS_STORE = 'commits'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(BUILDS_STORE)) {
        db.createObjectStore(BUILDS_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(PR_QUEUE_STORE)) {
        db.createObjectStore(PR_QUEUE_STORE, { autoIncrement: true })
      }
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE, { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains(PR_REVIEWS_STORE)) {
        db.createObjectStore(PR_REVIEWS_STORE, { keyPath: 'key' })
      }
      if (!db.objectStoreNames.contains(COMMITS_STORE)) {
        db.createObjectStore(COMMITS_STORE, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveBuild(build: object): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BUILDS_STORE, 'readwrite')
    tx.objectStore(BUILDS_STORE).put(build)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getCachedBuild(id: string): Promise<object | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(BUILDS_STORE, 'readonly').objectStore(BUILDS_STORE).get(id)
    req.onsuccess = () => resolve((req.result as object) ?? null)
    req.onerror = () => reject(req.error)
  })
}

// File content cache — keyed by "repo:path"
export async function saveFile(repo: string, path: string, content: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILES_STORE, 'readwrite')
    tx.objectStore(FILES_STORE).put({ key: `${repo}:${path}`, content, cachedAt: new Date().toISOString() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getCachedFile(repo: string, path: string): Promise<{ content: string; cachedAt: string } | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(FILES_STORE, 'readonly').objectStore(FILES_STORE).get(`${repo}:${path}`)
    req.onsuccess = () => resolve(req.result ? { content: req.result.content, cachedAt: req.result.cachedAt } : null)
    req.onerror = () => reject(req.error)
  })
}

// PR Agent reviews cache — keyed by "repo:pr"
export async function savePRReview(repo: string, pr: number, data: object): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PR_REVIEWS_STORE, 'readwrite')
    tx.objectStore(PR_REVIEWS_STORE).put({ key: `${repo}:${pr}`, data, cachedAt: new Date().toISOString() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getCachedPRReview(repo: string, pr: number): Promise<{ data: object; cachedAt: string } | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(PR_REVIEWS_STORE, 'readonly').objectStore(PR_REVIEWS_STORE).get(`${repo}:${pr}`)
    req.onsuccess = () => resolve(req.result ? { data: req.result.data, cachedAt: req.result.cachedAt } : null)
    req.onerror = () => reject(req.error)
  })
}

export interface QueuedPR {
  repo: string
  title: string
  body: string
  head: string
  base: string
  queuedAt: string
}

export async function enqueuePR(payload: QueuedPR): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PR_QUEUE_STORE, 'readwrite')
    tx.objectStore(PR_QUEUE_STORE).add(payload)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// Commit diff cache — keyed by "repo:sha"
export async function saveCommit(repo: string, sha: string, data: object): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COMMITS_STORE, 'readwrite')
    tx.objectStore(COMMITS_STORE).put({ key: `${repo}:${sha}`, data, cachedAt: new Date().toISOString() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getCachedCommit(repo: string, sha: string): Promise<{ data: object; cachedAt: string } | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(COMMITS_STORE, 'readonly').objectStore(COMMITS_STORE).get(`${repo}:${sha}`)
    req.onsuccess = () => resolve(req.result ? { data: req.result.data, cachedAt: req.result.cachedAt } : null)
    req.onerror = () => reject(req.error)
  })
}

export async function flushPRQueue(): Promise<{ key: IDBValidKey; value: QueuedPR }[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const items: { key: IDBValidKey; value: QueuedPR }[] = []
    const tx = db.transaction(PR_QUEUE_STORE, 'readwrite')
    const store = tx.objectStore(PR_QUEUE_STORE)
    const req = store.openCursor()
    req.onsuccess = () => {
      const cursor = req.result as IDBCursorWithValue | null
      if (cursor) {
        items.push({ key: cursor.key, value: cursor.value as QueuedPR })
        cursor.delete()
        cursor.continue()
      }
    }
    tx.oncomplete = () => resolve(items)
    tx.onerror = () => reject(tx.error)
  })
}
