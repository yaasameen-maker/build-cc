const DB_NAME = 'build-cc'
const DB_VERSION = 1
const BUILDS_STORE = 'builds'
const PR_QUEUE_STORE = 'pr-queue'

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
