import { useEffect } from 'react'
import { applause, partyHorn } from '../../helpers/sound'
import { formatElapsed } from './RunStatsHUD'

type Props = {
  passcode: string
  doorsUnlocked: number
  elapsedMs: number
  promptCount: number
  onRestart: () => void
}

export default function WinScreen({
  passcode,
  doorsUnlocked,
  elapsedMs,
  promptCount,
  onRestart,
}: Props) {
  useEffect(() => {
    try {
      const p = applause.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } catch {}
    try {
      const p = partyHorn.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    } catch {}
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
          <div className="win-screen__stat">
            <span className="win-screen__stat-label">passcode</span>
            <span className="win-screen__stat-value">{passcode}</span>
          </div>
          <div className="win-screen__stat">
            <span className="win-screen__stat-label">გახსნილი კარები</span>
            <span className="win-screen__stat-value">{doorsUnlocked}</span>
          </div>
        </div>
        <button className="win-screen__btn" onClick={onRestart}>
          თამაშის თავიდან დაწყება
        </button>
      </div>
    </div>
  )
}
