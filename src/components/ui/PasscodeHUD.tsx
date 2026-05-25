type Props = {
  totalSlots: number
  collected: string[]
}

export default function PasscodeHUD({ totalSlots, collected }: Props) {
  if (totalSlots === 0) return null
  return (
    <div className="passcode-hud">
      <div className="passcode-hud__label">PASSCODE</div>
      <div className="passcode-hud__slots">
        {Array.from({ length: totalSlots }, (_, i) => {
          const letter = collected[i]
          return (
            <span
              key={i}
              className={`passcode-hud__slot ${
                letter ? 'passcode-hud__slot--filled' : ''
              }`}
            >
              {letter || '_'}
            </span>
          )
        })}
      </div>
      <div className="passcode-hud__caption">
        გასახსნელად საჭიროა ბოლო კარის გასაღები
      </div>
    </div>
  )
}
