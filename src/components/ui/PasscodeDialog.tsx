import { useEffect, useRef, useState } from 'react'

type Props = {
  collected: string[]
  onSubmit: (input: string) => boolean
  onClose: () => void
}

export default function PasscodeDialog({ collected, onSubmit, onClose }: Props) {
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<'wrong' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const ref = useRef<HTMLInputElement | null>(null)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    ref.current?.focus()
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  const submit = () => {
    if (submitting) return
    if (!input.trim()) return
    setSubmitting(true)
    const ok = onSubmit(input)
    if (ok) return
    setFeedback('wrong')
    setInput('')
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      setFeedback(null)
      setSubmitting(false)
      ref.current?.focus()
      timeoutRef.current = null
    }, 1200)
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.code === 'Enter' || e.code === 'NumpadEnter') && !e.repeat) {
      e.preventDefault()
      submit()
    }
  }

  const refocus = () => {
    if (document.activeElement !== ref.current) ref.current?.focus()
  }

  return (
    <div className="passcode-dialog__backdrop" onMouseDown={refocus}>
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
          onBlur={() => window.setTimeout(refocus, 0)}
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
            disabled={!input.trim() || submitting}
          >
            გახსნა
          </button>
        </div>
      </div>
    </div>
  )
}
