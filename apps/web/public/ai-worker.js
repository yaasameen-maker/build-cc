// Standalone Web Worker — served from /public, not bundled by Next.js.
// Loads Transformers.js from CDN on first use; cached by the browser after that.

importScripts('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js')

const { pipeline, env } = self.Transformers
env.allowLocalModels = false
env.useBrowserCache = true

let generator = null

self.addEventListener('message', async (e) => {
  const { type, id, payload } = e.data

  if (type === 'load') {
    try {
      self.postMessage({ type: 'progress', id, progress: 0 })
      generator = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-77M', {
        progress_callback: (p) => {
          if (p.status === 'downloading') {
            const pct = p.total ? Math.round((p.loaded / p.total) * 100) : 0
            self.postMessage({ type: 'download-progress', id, file: p.file ?? '', loaded: p.loaded, total: p.total, pct })
          } else {
            self.postMessage({ type: 'progress', id, progress: Math.round(p.progress ?? 0) })
          }
        },
      })
      self.postMessage({ type: 'loaded', id, cached: true })
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
      const text = Array.isArray(result) ? result[0].generated_text : String(result)
      self.postMessage({ type: 'result', id, text: text.trim() })
    } catch (err) {
      self.postMessage({ type: 'error', id, message: String(err) })
    }
  }
})
