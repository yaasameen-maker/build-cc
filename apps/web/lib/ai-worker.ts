// Web Worker script — loaded via new Worker(new URL('./ai-worker.ts', import.meta.url))
// Runs Transformers.js in a background thread so the UI stays responsive.
// The model is cached in the browser's Cache API after first download.

import { pipeline, env } from '@xenova/transformers'

// Allow Transformers.js to cache model files in the browser
env.allowLocalModels = false
env.useBrowserCache = true

let generator: Awaited<ReturnType<typeof pipeline>> | null = null

self.addEventListener('message', async (e: MessageEvent) => {
  const { type, id, payload } = e.data

  if (type === 'load') {
    try {
      self.postMessage({ type: 'progress', id, status: 'loading', progress: 0 })
      generator = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-77M', {
        progress_callback: (progress: { progress?: number }) => {
          self.postMessage({ type: 'progress', id, status: 'downloading', progress: Math.round(progress.progress ?? 0) })
        },
      })
      self.postMessage({ type: 'loaded', id })
    } catch (err) {
      self.postMessage({ type: 'error', id, message: String(err) })
    }
    return
  }

  if (type === 'analyze') {
    if (!generator) { self.postMessage({ type: 'error', id, message: 'Model not loaded' }); return }
    try {
      const { issue, snippet } = payload
      const prompt = `Fix this code issue: "${issue}"\n\nCode:\n${snippet}\n\nSuggested fix:`
      const result = await generator(prompt, { max_new_tokens: 120, do_sample: false })
      const text = Array.isArray(result) ? (result[0] as { generated_text: string }).generated_text : String(result)
      self.postMessage({ type: 'result', id, text: text.trim() })
    } catch (err) {
      self.postMessage({ type: 'error', id, message: String(err) })
    }
  }
})
