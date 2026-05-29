import { useEffect, useReducer } from 'react'

// Legacy fallback — used only when App.tsx is in mock mode and gets no run
// duration back from the session response. Real runs come from the backend.
export const DEFAULT_RUN_DURATION_MS = 10 * 60 * 1000

type Props = {
  startedAt: number
  endedAt: number | null
  promptCount: number
  durationMs: number
  lost?: boolean
}

export function formatElapsed(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000))
  const mm = String(Math.floor(sec / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export default function RunStatsHUD({
  startedAt,
  endedAt,
  promptCount,
  durationMs,
  lost,
}: Props) {
  const [, force] = useReducer((s: number) => s + 1, 0)

  useEffect(() => {
    if (endedAt !== null || lost) return
    const id = setInterval(force, 250)
    return () => clearInterval(id)
  }, [endedAt, lost])

  const now = endedAt ?? Date.now()
  const remaining = Math.max(0, startedAt + durationMs - now)
  const finished = endedAt !== null
  const expired = remaining === 0

  const cls = finished
    ? 'run-stats-hud--finished'
    : expired
      ? 'run-stats-hud--expired'
      : remaining < 30_000
        ? 'run-stats-hud--critical'
        : remaining < 120_000
          ? 'run-stats-hud--warning'
          : ''

  return (
    <div className={`run-stats-hud ${cls}`}>
      <div className="run-stats-hud__row">
        <span className="run-stats-hud__label">TIME LEFT</span>
        <span className="run-stats-hud__value">{formatElapsed(remaining)}</span>
      </div>
      <div className="run-stats-hud__row">
        <span className="run-stats-hud__label">PROMPTS</span>
        <span className="run-stats-hud__value">{promptCount}</span>
      </div>
    </div>
  )
}
