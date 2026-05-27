import { useEffect, useRef, useState } from 'react'
import { Door } from '../../game/doors'
import { Scenario } from '../../game/scenarios'

type Props = {
  door: Door
  scenario: Scenario
  attemptsLeft: number
  onSubmit: (answer: string) => 'correct' | 'wrong' | 'cooldown'
  onClose: () => void
}

export default function ScenarioDialog(props: Props) {
  if (props.door.status === 'answered') {
    return <ScenarioSuccess door={props.door} scenario={props.scenario} onClose={props.onClose} />
  }
  return <ScenarioAsking {...props} />
}

function ScenarioAsking({ scenario, attemptsLeft, onSubmit, onClose }: Props) {
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<'wrong' | 'cooldown' | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const submit = () => {
    if (!answer.trim()) return
    const result = onSubmit(answer)
    if (result === 'wrong') {
      setFeedback('wrong')
      setAnswer('')
      setTimeout(() => {
        setFeedback(null)
        textareaRef.current?.focus()
      }, 1200)
    } else if (result === 'cooldown') {
      setFeedback('cooldown')
      setTimeout(() => onClose(), 1400)
    }
  }

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.code === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="scenario-dialog__backdrop" onMouseDown={e => e.stopPropagation()}>
      <div className="scenario-dialog" role="dialog" aria-modal="true">
        <div className="scenario-dialog__header">
          <span className="scenario-dialog__npc-badge">NPC</span>
          <span className="scenario-dialog__npc">{scenario.npc}</span>
          <button
            className="scenario-dialog__close"
            onClick={onClose}
            aria-label="Close"
            title="Close (Esc)"
          >
            ×
          </button>
        </div>
        <div className="scenario-dialog__text">{scenario.scenario}</div>
        <textarea
          ref={textareaRef}
          className="scenario-dialog__textarea"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          onKeyDown={onKey}
          placeholder="დაწერე პასუხი... (Enter გასაგზავნად, Shift+Enter ახალი ხაზი)"
          rows={4}
        />
        <div className="scenario-dialog__footer">
          <span className="scenario-dialog__attempts">
            ცდები: <b>{attemptsLeft}/3</b>
          </span>
          {feedback === 'wrong' && (
            <span className="scenario-dialog__feedback scenario-dialog__feedback--wrong">
              ✗ არასწორი — სცადე ხელახლა
            </span>
          )}
          {feedback === 'cooldown' && (
            <span className="scenario-dialog__feedback scenario-dialog__feedback--cooldown">
              კარი დაიკეტა 5 წამით
            </span>
          )}
          <div className="scenario-dialog__spacer" />
          <button className="scenario-dialog__btn-secondary" onClick={onClose}>
            დახურვა
          </button>
          <button
            className="scenario-dialog__btn-primary"
            onClick={submit}
            disabled={!answer.trim() || feedback !== null}
          >
            გაგზავნა
          </button>
        </div>
      </div>
    </div>
  )
}

function ScenarioSuccess({
  door,
  scenario,
  onClose,
}: {
  door: Door
  scenario: Scenario
  onClose: () => void
}) {
  return (
    <div className="scenario-dialog__backdrop" onMouseDown={e => e.stopPropagation()}>
      <div className="scenario-dialog scenario-dialog--success" role="dialog" aria-modal="true">
        <div className="scenario-dialog__header">
          <span className="scenario-dialog__npc-badge scenario-dialog__npc-badge--success">
            სწორი
          </span>
          <span className="scenario-dialog__npc">{scenario.npc}</span>
          <button
            className="scenario-dialog__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="scenario-dialog__big-letter">{door.letter}</div>
        <div className="scenario-dialog__instructions">
          დაიმახსოვრე ეს ასო — ბოლო კარის გასახსნელად დაგჭირდება.
          <br />
          დააჭირე <kbd>U</kbd> კარის გასახსნელად.
        </div>
        <div className="scenario-dialog__footer">
          <div className="scenario-dialog__spacer" />
          <button className="scenario-dialog__btn-primary" onClick={onClose}>
            დახურვა (<kbd>Esc</kbd>)
          </button>
        </div>
      </div>
    </div>
  )
}
