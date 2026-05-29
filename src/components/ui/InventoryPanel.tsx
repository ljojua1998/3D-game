import { useState } from 'react'
import { ChatLanguage, InventoryItem } from '../../game/puzzles'

type Props = {
  items: InventoryItem[]
  language: ChatLanguage
  busy: boolean
  feedback: 'wrong' | null
  onSubmit: (toolIds: string[]) => void
  onCancel: () => void
}

const COPY = {
  ka: {
    title: 'აირჩიე ხელსაწყოები',
    hint: 'მონიშნე ის, რაც კარის გასახსნელად დაგჭირდება.',
    submit: 'გაგზავნა',
    cancel: 'უკან',
    wrong: '✗ არასწორი არჩევანი',
  },
  en: {
    title: 'Pick the tools',
    hint: 'Tick the items you think the door requires.',
    submit: 'Submit',
    cancel: 'Back',
    wrong: '✗ Wrong selection',
  },
}

export default function InventoryPanel({
  items,
  language,
  busy,
  feedback,
  onSubmit,
  onCancel,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const c = COPY[language]

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="inventory-panel">
      <div className="inventory-panel__title">{c.title}</div>
      <div className="inventory-panel__hint">{c.hint}</div>
      <div className="inventory-panel__grid">
        {items.map(it => {
          const active = selected.has(it.id)
          return (
            <button
              key={it.id}
              className={`inventory-panel__item ${
                active ? 'inventory-panel__item--active' : ''
              }`}
              onClick={() => toggle(it.id)}
              type="button"
              disabled={busy}
            >
              <span className="inventory-panel__icon">{it.icon}</span>
              <span className="inventory-panel__label">{it.label[language]}</span>
            </button>
          )
        })}
      </div>
      <div className="inventory-panel__footer">
        {feedback === 'wrong' && (
          <span className="inventory-panel__feedback">{c.wrong}</span>
        )}
        <div className="inventory-panel__spacer" />
        <button
          className="inventory-panel__btn-secondary"
          onClick={onCancel}
          type="button"
          disabled={busy}
        >
          {c.cancel}
        </button>
        <button
          className="inventory-panel__btn-primary"
          onClick={() => onSubmit(Array.from(selected))}
          type="button"
          disabled={busy || selected.size === 0}
        >
          {c.submit}
        </button>
      </div>
    </div>
  )
}
