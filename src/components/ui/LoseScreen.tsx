type Props = {
  doorsUnlocked: number
  totalDoors: number
  promptCount: number
  durationMs: number
  reason?: 'time-out' | 'wrong-attempts'
  maxWrong?: number
  onRestart: () => void
}

export default function LoseScreen({
  doorsUnlocked,
  totalDoors,
  promptCount,
  durationMs,
  reason = 'time-out',
  maxWrong = 3,
  onRestart,
}: Props) {
  const totalMinutes = Math.round(durationMs / 60000)
  const isWrongAttempts = reason === 'wrong-attempts'
  const title = isWrongAttempts ? 'GAME OVER' : "TIME'S UP"
  const sub = isWrongAttempts
    ? `${maxWrong} არასწორი მცდელობა — კარი დაიხურა`
    : `${totalMinutes} წუთი ამოგეწურა`
  return (
    <div className="lose-screen__backdrop">
      <div className="lose-screen" role="dialog" aria-modal="true">
        <div className="lose-screen__title">{title}</div>
        <div className="lose-screen__sub">{sub}</div>
        <div className="lose-screen__stats">
          <div className="lose-screen__stat">
            <span className="lose-screen__stat-label">კარები</span>
            <span className="lose-screen__stat-value">
              {doorsUnlocked}/{totalDoors}
            </span>
          </div>
          <div className="lose-screen__stat">
            <span className="lose-screen__stat-label">prompts</span>
            <span className="lose-screen__stat-value">{promptCount}</span>
          </div>
        </div>
        <button className="lose-screen__btn" onClick={onRestart}>
          ახალი მოთამაშე
        </button>
      </div>
    </div>
  )
}
