export const MODEL_CACHE = 'model-cache-v1'

export async function clearModelCache(): Promise<boolean> {
  return caches.delete(MODEL_CACHE)
}

export async function hasModelCache(): Promise<boolean> {
  return caches.has(MODEL_CACHE)
}
