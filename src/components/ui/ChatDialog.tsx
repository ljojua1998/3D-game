import { useEffect, useMemo, useRef, useState } from 'react'
import { Door } from '../../game/doors'
import { ChatLanguage, InventoryItem } from '../../game/puzzles'
import { streamChat, submitDoor } from '../../ai/chatClient'
import InventoryPanel from './InventoryPanel'

type ChatMessage = {
  role: 'user' | 'assistant'
  text: string
  streaming?: boolean
}

type Props = {
  door: Door
  sessionId: string
  inventoryItems: InventoryItem[]
  language: ChatLanguage
  onLanguageChange: (l: ChatLanguage) => void
  onPromptSent: () => void
  onUnlocked: () => void
  onWrongGuess: () => void
  wrongCount: number
  maxWrong: number
  onClose: () => void
}

const COPY = {
  ka: {
    placeholder: (persona: string) => `დაუსვი კითხვა ${persona}-ს... (Enter გასაგზავნად)`,
    send: 'გაგზავნა',
    close: 'დახურვა',
    guessLabel: 'საიდუმლო სიტყვა',
    guessPlaceholder: 'ჩაწერე ჩაფიქრებული სიტყვა',
    submitGuess: 'სიტყვის გაგზავნა',
    openInventory: 'ხელსაწყოების არჩევა',
    thinking: (persona: string) => `${persona} ფიქრობს...`,
    wrongGuess: '✗ არასწორი სიტყვა',
    attempts: (used: number, max: number) => `მცდელობა ${used}/${max}`,
    lastChance: 'უკანასკნელი ცდა — შემდეგი არასწორი პასუხი თამაშს დაასრულებს',
    error: 'შეცდომა AI-სთან კავშირში',
    unlocked: '✓ კარი გაიხსნა',
  },
  en: {
    placeholder: (persona: string) => `Ask ${persona} a question... (Enter to send)`,
    send: 'Send',
    close: 'Close',
    guessLabel: 'Secret word',
    guessPlaceholder: 'Type the secret word',
    submitGuess: 'Submit word',
    openInventory: 'Pick tools',
    thinking: (persona: string) => `${persona} is thinking...`,
    wrongGuess: '✗ Wrong word',
    attempts: (used: number, max: number) => `Attempt ${used}/${max}`,
    lastChance: 'Last chance — another wrong answer will end the game',
    error: 'Error contacting the AI',
    unlocked: '✓ Door unlocked',
  },
}

export default function ChatDialog({
  door,
  sessionId,
  inventoryItems,
  language,
  onLanguageChange,
  onPromptSent,
  onUnlocked,
  onWrongGuess,
  wrongCount,
  maxWrong,
  onClose,
}: Props) {
  const c = COPY[language]
  const intro = useMemo<ChatMessage>(() => ({
    role: 'assistant',
    text: door.displayConfig.theme[language],
  }), [door, language])

  const [messages, setMessages] = useState<ChatMessage[]>([intro])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guessInput, setGuessInput] = useState('')
  const [guessFeedback, setGuessFeedback] = useState<'wrong' | null>(null)
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [inventoryFeedback, setInventoryFeedback] = useState<'wrong' | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  // Tracks the in-flight chat stream so we can cancel it when the dialog is
  // closed/unmounted mid-reply. Without this the fetch keeps running on the
  // server (dangling request, extra prompt bump) and a quick close→reopen→send
  // would leave two concurrent /chat requests racing on the same session.
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Abort any in-flight stream on unmount (dialog close, door change, win/lose).
  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 0) return [intro]
      const next = prev.slice()
      next[0] = intro
      return next
    })
  }, [intro])

  const send = async () => {
    const text = input.trim()
    if (!text || streaming || unlocked) return
    setInput('')
    setError(null)
    setMessages(prev => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: '', streaming: true },
    ])
    setStreaming(true)
    onPromptSent()
    // Cancel any prior in-flight stream before starting a new one.
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    // Watchdog: never let a non-responding server hang the UI forever. The
    // server's maxDuration is 30s, so 45s is a safe outer bound. `timedOut`
    // lets the catch tell a genuine timeout apart from an intentional abort
    // (dialog close / superseding send), which must stay silent.
    let timedOut = false
    const watchdog = setTimeout(() => {
      timedOut = true
      ac.abort()
    }, 45000)
    try {
      await streamChat(
        { sessionId, doorId: door.id, language, message: text, signal: ac.signal },
        {
          onChunk: chunk => {
            setMessages(prev => {
              const next = prev.slice()
              const last = next[next.length - 1]
              if (last && last.role === 'assistant' && last.streaming) {
                next[next.length - 1] = { ...last, text: last.text + chunk }
              }
              return next
            })
          },
          onDone: () => {
            setMessages(prev => {
              const next = prev.slice()
              const last = next[next.length - 1]
              if (last && last.role === 'assistant') {
                next[next.length - 1] = { ...last, streaming: false }
              }
              return next
            })
            setStreaming(false)
          },
          onError: msg => {
            setError(msg)
            setMessages(prev => {
              const next = prev.slice()
              const last = next[next.length - 1]
              if (last && last.role === 'assistant' && last.streaming) {
                next.pop()
              }
              return next
            })
            setStreaming(false)
          },
        },
      )
    } catch (err) {
      // An intentional cancel (dialog closed / superseded by a newer send) is
      // not an error — but a watchdog timeout reuses AbortError, so surface it.
      if ((err as { name?: string })?.name === 'AbortError' && !timedOut) return
      setError(timedOut ? 'timeout' : String(err))
      // Drop the empty placeholder bubble we pushed for the (failed) reply.
      setMessages(prev => {
        const next = prev.slice()
        const last = next[next.length - 1]
        if (last && last.role === 'assistant' && last.streaming) next.pop()
        return next
      })
    } finally {
      clearTimeout(watchdog)
      // Safety net for a stream that closed without a done/error event: only
      // the active request resets `streaming` (a newer send already owns
      // abortRef, and aborting this one must not re-enable input under it).
      if (abortRef.current === ac) setStreaming(false)
    }
  }

  const submitGuess = async () => {
    const guess = guessInput.trim()
    if (!guess || submitting || unlocked) return
    setSubmitting(true)
    setGuessFeedback(null)
    // Door guesses are not "prompts" — only AI questions (send) count.
    try {
      const res = await submitDoor({ sessionId, doorId: door.id, guess })
      if (res.ok) {
        setUnlocked(true)
        setTimeout(() => {
          onUnlocked()
        }, 700)
      } else {
        setGuessFeedback('wrong')
        setGuessInput('')
        setTimeout(() => setGuessFeedback(null), 1200)
        onWrongGuess()
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const submitTools = async (toolIds: string[]) => {
    if (submitting || unlocked) return
    setSubmitting(true)
    setInventoryFeedback(null)
    // Tool picks are not "prompts" — only AI questions (send) count.
    try {
      const res = await submitDoor({ sessionId, doorId: door.id, tools: toolIds })
      if (res.ok) {
        setUnlocked(true)
        setTimeout(() => {
          onUnlocked()
        }, 700)
      } else {
        setInventoryFeedback('wrong')
        setTimeout(() => setInventoryFeedback(null), 1400)
        onWrongGuess()
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const onTextareaKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.code === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const onGuessKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      e.preventDefault()
      submitGuess()
    }
  }

  return (
    <div className="chat-dialog__backdrop" onMouseDown={e => e.stopPropagation()}>
      <div className="chat-dialog" role="dialog" aria-modal="true">
        <div className="chat-dialog__header">
          <span className="chat-dialog__npc-badge">AI</span>
          <span className="chat-dialog__npc">
            {door.displayConfig.persona[language]}
          </span>
          <div className="chat-dialog__lang">
            <button
              className={`chat-dialog__lang-btn ${
                language === 'ka' ? 'chat-dialog__lang-btn--active' : ''
              }`}
              onClick={() => onLanguageChange('ka')}
              type="button"
            >
              KA
            </button>
            <button
              className={`chat-dialog__lang-btn ${
                language === 'en' ? 'chat-dialog__lang-btn--active' : ''
              }`}
              onClick={() => onLanguageChange('en')}
              type="button"
            >
              EN
            </button>
          </div>
          <button
            className="chat-dialog__close"
            onClick={onClose}
            aria-label="Close"
            title="Close (Esc)"
            type="button"
          >
            ×
          </button>
        </div>

        {/* 🐞 DEBUG_ANSWER (test only) — shows the per-run randomized answer for
            this door so testers can verify what was rolled. COMMENT OUT the
            block below (and the server _debugAnswer) before going to prod. */}
        {door._debugAnswer && (
          <div
            style={{
              padding: '6px 12px',
              background: '#3a1d1d',
              color: '#ffb4b4',
              fontSize: 12,
              fontFamily: 'monospace',
              borderBottom: '1px solid #5a2a2a',
              wordBreak: 'break-word',
            }}
          >
            🐞 {door.type === 'secret-word'
              ? `secret: ${
                  door._debugAnswer.secret
                    ? `ka="${door._debugAnswer.secret.ka}" · en="${door._debugAnswer.secret.en}"`
                    : '—'
                }`
              : `tools: ${
                  (door._debugAnswer.tools ?? [])
                    .map(id => {
                      const it = inventoryItems.find(i => i.id === id)
                      return it ? `${it.icon} ${it.label[language]}` : id
                    })
                    .join(', ') || '—'
                }`}
          </div>
        )}

        <div className="chat-dialog__messages" ref={listRef}>
          {messages.map((m, i) => (
            <div
              key={i}
              className={`chat-dialog__msg chat-dialog__msg--${m.role}`}
            >
              <span className="chat-dialog__msg-bubble">
                {m.streaming && m.text === '' ? (
                  <span
                    className="chat-dialog__typing"
                    role="status"
                    aria-label={c.thinking(door.displayConfig.persona[language])}
                  >
                    <span className="chat-dialog__typing-dot" />
                    <span className="chat-dialog__typing-dot" />
                    <span className="chat-dialog__typing-dot" />
                  </span>
                ) : (
                  <>
                    {m.text}
                    {m.streaming && <span className="chat-dialog__cursor">▍</span>}
                  </>
                )}
              </span>
            </div>
          ))}
          {streaming && messages[messages.length - 1]?.text === '' && (
            <div className="chat-dialog__hint-line">
              {c.thinking(door.displayConfig.persona[language])}
            </div>
          )}
          {error && <div className="chat-dialog__error">{c.error}: {error}</div>}
          {unlocked && <div className="chat-dialog__unlocked">{c.unlocked}</div>}
          {!unlocked && wrongCount > 0 && (
            <div className={`chat-dialog__attempts${wrongCount === maxWrong - 1 ? ' chat-dialog__attempts--last' : ''}`}>
              {c.attempts(wrongCount, maxWrong)}
              {wrongCount === maxWrong - 1 && (
                <div className="chat-dialog__last-chance">{c.lastChance}</div>
              )}
            </div>
          )}
        </div>

        {!inventoryOpen && (
          <>
            <textarea
              ref={textareaRef}
              className="chat-dialog__textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onTextareaKey}
              placeholder={c.placeholder(door.displayConfig.persona[language])}
              rows={2}
              disabled={streaming || unlocked}
            />
            {door.type === 'secret-word' && (
              <div className="chat-dialog__guess-row">
                <label className="chat-dialog__guess-label">{c.guessLabel}</label>
                <input
                  className="chat-dialog__guess-input"
                  value={guessInput}
                  onChange={e => setGuessInput(e.target.value)}
                  onKeyDown={onGuessKey}
                  placeholder={c.guessPlaceholder}
                  disabled={submitting || unlocked}
                />
                <button
                  className="chat-dialog__btn-primary"
                  onClick={submitGuess}
                  disabled={!guessInput.trim() || submitting || unlocked}
                  type="button"
                >
                  {c.submitGuess}
                </button>
                {guessFeedback === 'wrong' && (
                  <span className="chat-dialog__feedback">{c.wrongGuess}</span>
                )}
              </div>
            )}
            <div className="chat-dialog__footer">
              {door.type === 'tools' && (
                <button
                  className="chat-dialog__btn-secondary"
                  onClick={() => setInventoryOpen(true)}
                  type="button"
                  disabled={unlocked}
                >
                  {c.openInventory}
                </button>
              )}
              <div className="chat-dialog__spacer" />
              <button
                className="chat-dialog__btn-primary"
                onClick={send}
                type="button"
                disabled={!input.trim() || streaming || unlocked}
              >
                {c.send}
              </button>
            </div>
          </>
        )}

        {inventoryOpen && door.type === 'tools' && (
          <InventoryPanel
            items={inventoryItems}
            language={language}
            busy={submitting || unlocked}
            feedback={inventoryFeedback}
            onSubmit={submitTools}
            onCancel={() => setInventoryOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
