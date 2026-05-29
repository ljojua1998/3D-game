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
  onClose: () => void
}

const COPY = {
  ka: {
    placeholder: 'დაუსვი კითხვა AI-ს... (Enter გასაგზავნად)',
    send: 'გაგზავნა',
    close: 'დახურვა',
    guessLabel: 'საიდუმლო სიტყვა',
    guessPlaceholder: 'ჩაწერე ჩაფიქრებული სიტყვა',
    submitGuess: 'სიტყვის გაგზავნა',
    openInventory: 'ხელსაწყოების არჩევა',
    thinking: 'AI ფიქრობს...',
    wrongGuess: '✗ არასწორი სიტყვა',
    error: 'შეცდომა AI-სთან კავშირში',
    unlocked: '✓ კარი გაიხსნა',
  },
  en: {
    placeholder: 'Ask the AI a question... (Enter to send)',
    send: 'Send',
    close: 'Close',
    guessLabel: 'Secret word',
    guessPlaceholder: 'Type the secret word',
    submitGuess: 'Submit word',
    openInventory: 'Pick tools',
    thinking: 'AI is thinking...',
    wrongGuess: '✗ Wrong word',
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
  const [guessOpen, setGuessOpen] = useState(false)
  const [guessFeedback, setGuessFeedback] = useState<'wrong' | null>(null)
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [inventoryFeedback, setInventoryFeedback] = useState<'wrong' | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

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
    try {
      await streamChat(
        { sessionId, doorId: door.id, language, message: text },
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
      setError(String(err))
      setStreaming(false)
    }
  }

  const submitGuess = async () => {
    const guess = guessInput.trim()
    if (!guess || submitting || unlocked) return
    setSubmitting(true)
    setGuessFeedback(null)
    onPromptSent()
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
    onPromptSent()
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

        <div className="chat-dialog__messages" ref={listRef}>
          {messages.map((m, i) => (
            <div
              key={i}
              className={`chat-dialog__msg chat-dialog__msg--${m.role}`}
            >
              <span className="chat-dialog__msg-bubble">
                {m.text}
                {m.streaming && <span className="chat-dialog__cursor">▍</span>}
              </span>
            </div>
          ))}
          {streaming && messages[messages.length - 1]?.text === '' && (
            <div className="chat-dialog__hint-line">{c.thinking}</div>
          )}
          {error && <div className="chat-dialog__error">{c.error}: {error}</div>}
          {unlocked && <div className="chat-dialog__unlocked">{c.unlocked}</div>}
        </div>

        {!inventoryOpen && (
          <>
            <textarea
              ref={textareaRef}
              className="chat-dialog__textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onTextareaKey}
              placeholder={c.placeholder}
              rows={2}
              disabled={streaming || unlocked}
            />
            {door.type === 'secret-word' && guessOpen && (
              <div className="chat-dialog__guess-row">
                <label className="chat-dialog__guess-label">{c.guessLabel}</label>
                <input
                  className="chat-dialog__guess-input"
                  value={guessInput}
                  onChange={e => setGuessInput(e.target.value)}
                  onKeyDown={onGuessKey}
                  placeholder={c.guessPlaceholder}
                  disabled={submitting || unlocked}
                  autoFocus
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
              {door.type === 'secret-word' && (
                <button
                  className="chat-dialog__btn-secondary"
                  onClick={() => setGuessOpen(v => !v)}
                  type="button"
                  disabled={unlocked}
                >
                  {c.guessLabel}
                </button>
              )}
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
