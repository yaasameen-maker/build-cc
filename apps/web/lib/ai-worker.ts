// AI worker is served from /public/ai-worker.js (plain script, loaded via CDN).
// This file is a type reference only — nothing here is bundled.
export type AIWorkerMessage =
  | { type: 'load'; id: number }
  | { type: 'analyze'; id: number; payload: { issue: string; snippet: string } }

export type AIWorkerResponse =
  | { type: 'progress'; id: number; progress: number }
  | { type: 'loaded'; id: number }
  | { type: 'result'; id: number; text: string }
  | { type: 'error'; id: number; message: string }
