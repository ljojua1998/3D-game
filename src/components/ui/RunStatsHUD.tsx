import { useEffect, useReducer } from 'react'

type Props = {
  startedAt: number
  endedAt: number | null
  promptCount: number
}

export function formatElapsed(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000))
  const mm = String(Math.floor(sec / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export default function RunStatsHUD({ startedAt, endedAt, promptCount }: Props) {
  const [, force] = useReducer((s: number) => s + 1, 0)

  useEffect(() => {
    if (endedAt !== null) return
    const id = setInterval(force, 250)
    return () => clearInterval(id)
  }, [endedAt])

  const elapsed = (endedAt ?? Date.now()) - startedAt
  const finished = endedAt !== null

  return (
    <div className={`run-stats-hud ${finished ? 'run-stats-hud--finished' : ''}`}>
      <div className="run-stats-hud__row">
        <span className="run-stats-hud__label">TIME</span>
        <span className="run-stats-hud__value">{formatElapsed(elapsed)}</span>
      </div>
      <div className="run-stats-hud__row">
        <span className="run-stats-hud__label">PROMPTS</span>
        <span className="run-stats-hud__value">{promptCount}</span>
      </div>
    </div>
  )
}
