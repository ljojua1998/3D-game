/**
 * Tiny helper for emitting widget lifecycle events to the embedding host.
 * No-op if running standalone (window.parent === window).
 */
export type PromptMazeMessage =
  | { type: 'promptmaze:ready' }
  | { type: 'promptmaze:run-started'; sessionId: string }
  | {
      type: 'promptmaze:run-finished'
      sessionId: string
      elapsedMs: number
      promptCount: number
      completed: boolean
      rank?: number | null
      totalCompleted?: number
    }

export function emitToParent(payload: PromptMazeMessage): void {
  if (typeof window === 'undefined') return
  if (window.parent === window) return
  try {
    window.parent.postMessage(payload, '*')
  } catch {
    // parent unreachable (cross-origin, no permission); silent
  }
}
