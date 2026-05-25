import { useEffect, useRef, useState } from 'react'

type Props = {
  collected: string[]
  onSubmit: (input: string) => boolean
  onClose: () => void
}

export default function PasscodeDialog({ collected, onSubmit, onClose }: Props) {
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<'wrong' | null>(null)
  const ref = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  const submit = () => {
    if (!input.trim()) return
    const ok = onSubmit(input)
    if (!ok) {
      setFeedback('wrong')
      setInput('')
      setTimeout(() => {
        setFeedback(null)
        ref.current?.focus()
      }, 1200)
    }
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.code === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="passcode-dialog__backdrop">
      <div className="passcode-dialog" role="dialog" aria-modal="true">
        <div className="passcode-dialog__header">
          <span className="passcode-dialog__badge">EXIT</span>
          <span className="passcode-dialog__title">შეიყვანე passcode</span>
          <button
            className="passcode-dialog__close"
            onClick={onClose}
            aria-label="Close"
            title="Close (Esc)"
          >
            ×
          </button>
        </div>
        <div className="passcode-dialog__hint">
          შენ შეაგროვე {collected.length} ასო. ჩაწერე ისინი ნებისმიერი თანმიმდევრობით.
        </div>
        <div className="passcode-dialog__slots">
          {collected.map((c, i) => (
            <span key={i} className="passcode-dialog__slot">{c}</span>
          ))}
        </div>
        <input
          ref={ref}
          className="passcode-dialog__input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="მაგ.: M A Z E"
          autoComplete="off"
          spellCheck={false}
        />
        <div className="passcode-dialog__footer">
          {feedback === 'wrong' && (
            <span className="passcode-dialog__feedback">✗ არასწორი passcode</span>
          )}
          <div className="passcode-dialog__spacer" />
          <button className="passcode-dialog__btn-secondary" onClick={onClose}>
            დახურვა
          </button>
          <button
            className="passcode-dialog__btn-primary"
            onClick={submit}
            disabled={!input.trim() || feedback !== null}
          >
            გახსნა
          </button>
        </div>
      </div>
    </div>
  )
}
