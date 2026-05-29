import { useEffect } from 'react'
import { applause, partyHorn } from '../../helpers/sound'
import { formatElapsed } from './RunStatsHUD'

type Props = {
  elapsedMs: number
  promptCount: number
  rank?: number | null
  totalCompleted?: number
  prizes?: string[]
  onRestart: () => void
}

export default function WinScreen({ elapsedMs, promptCount, rank, totalCompleted, prizes, onRestart }: Props) {
  const prize = rank != null && Array.isArray(prizes) && prizes[rank - 1] ? prizes[rank - 1] : null
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
          {rank != null && (
            <div className="win-screen__stat">
              <span className="win-screen__stat-label">rank</span>
              <span className="win-screen__stat-value">
                #{rank}
                {totalCompleted ? ` / ${totalCompleted}` : ''}
              </span>
            </div>
          )}
        </div>
        {prize && (
          <div
            style={{
              background: 'rgba(255, 204, 51, 0.12)',
              border: '1px solid rgba(255, 204, 51, 0.5)',
              borderRadius: 6,
              padding: '14px 18px',
              marginBottom: 18,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 10,
                letterSpacing: '0.22em',
                color: 'rgba(255, 204, 51, 0.7)',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              🏆 პრიზი
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fc3' }}>{prize}</div>
          </div>
        )}
        <button className="win-screen__btn" onClick={onRestart}>
          თამაშის თავიდან დაწყება
        </button>
      </div>
    </div>
  )
}
