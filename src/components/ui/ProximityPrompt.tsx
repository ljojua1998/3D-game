import { useEffect, useReducer } from 'react'

type DoorStatus = 'locked' | 'answered' | 'cooldown'
type GateKind = 'ready' | 'locked'

type Props = {
  status: DoorStatus | null
  cooldownUntil?: number
  letter?: string
  gateKind?: GateKind | null
}

export default function ProximityPrompt({ status, cooldownUntil, letter, gateKind }: Props) {
  const [, force] = useReducer((s: number) => s + 1, 0)

  useEffect(() => {
    if (status !== 'cooldown') return
    const id = setInterval(force, 250)
    return () => clearInterval(id)
  }, [status])

  if (status) {
    if (status === 'locked') {
      return (
        <div className="proximity-prompt">
          <kbd className="proximity-prompt__key">T</kbd>
          <span className="proximity-prompt__label">გასაუბრება NPC-სთან</span>
        </div>
      )
    }
    if (status === 'answered') {
      return (
        <div className="proximity-prompt proximity-prompt--ready">
          <kbd className="proximity-prompt__key">U</kbd>
          <span className="proximity-prompt__label">
            კარის გახსნა {letter && <>(ასო: <b>{letter}</b>)</>}
          </span>
        </div>
      )
    }
    if (status === 'cooldown' && cooldownUntil) {
      const left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
      return (
        <div className="proximity-prompt proximity-prompt--cooldown">
          <span className="proximity-prompt__label">კარი დაიკეტა — {left}წ</span>
        </div>
      )
    }
  }

  if (gateKind === 'ready') {
    return (
      <div className="proximity-prompt proximity-prompt--gate-ready">
        <kbd className="proximity-prompt__key">E</kbd>
        <span className="proximity-prompt__label">გასასვლელის passcode-ის შეყვანა</span>
      </div>
    )
  }

  if (gateKind === 'locked') {
    return (
      <div className="proximity-prompt proximity-prompt--gate-locked">
        <span className="proximity-prompt__label">გასასვლელი დაკეტილია — შეაგროვე ყველა ასო</span>
      </div>
    )
  }

  return null
}
