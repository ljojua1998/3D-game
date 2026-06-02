import { useEffect } from 'react'
// Win sounds disabled — re-enable by uncommenting the import below and the play() calls in useEffect.
// import { applause, partyHorn } from '../../helpers/sound'
import { formatElapsed } from './RunStatsHUD'

type Props = {
  elapsedMs: number
  promptCount: number
  rank?: number | null
  totalCompleted?: number
  prizes?: string[]
  onRestart: () => void
}

export default function WinScreen({ elapsedMs, promptCount, onRestart }: Props) {
  useEffect(() => {
    // Win sounds disabled per request — re-enable by uncommenting below.
    // try {
    //   const p = applause.play()
    //   if (p && typeof p.catch === 'function') p.catch(() => {})
    // } catch {}
    // try {
    //   const p = partyHorn.play()
    //   if (p && typeof p.catch === 'function') p.catch(() => {})
    // } catch {}
  }, [])

  return (
    <div className="win-screen__backdrop">
      <div className="win-screen" role="dialog" aria-modal="true">
        <div className="win-screen__title">YOU WIN!</div>
        <div className="win-screen__sub">გაიარე ლაბირინთი</div>
        <div className="win-screen__stats">
          <div className="win-screen__stat">
            <span className="win-screen__stat-label">დრო</span>
            <span className="win-screen__stat-value">{formatElapsed(elapsedMs)}</span>
          </div>
          <div className="win-screen__stat">
            <span className="win-screen__stat-label">prompts</span>
            <span className="win-screen__stat-value">{promptCount}</span>
          </div>
        </div>
        {/* Rank + prize intentionally NOT shown here: the rank at finish time is
            provisional (a later, faster player can bump this run down), so
            promising a prize on the win screen could be wrong. Final standings
            live on the leaderboard. */}
        <button className="win-screen__btn" onClick={onRestart}>
          თამაშის თავიდან დაწყება
        </button>
      </div>
    </div>
  )
}
