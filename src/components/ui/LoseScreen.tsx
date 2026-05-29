type Props = {
  doorsUnlocked: number
  totalDoors: number
  promptCount: number
  onRestart: () => void
}

export default function LoseScreen({
  doorsUnlocked,
  totalDoors,
  promptCount,
  onRestart,
}: Props) {
  return (
    <div className="lose-screen__backdrop">
      <div className="lose-screen" role="dialog" aria-modal="true">
        <div className="lose-screen__title">TIME'S UP</div>
        <div className="lose-screen__sub">10 წუთი ამოგეწურა</div>
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
          ხელახლა ცდა
        </button>
      </div>
    </div>
  )
}
