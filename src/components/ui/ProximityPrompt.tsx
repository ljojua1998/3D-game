type DoorStatus = 'locked'

type Props = {
  status: DoorStatus | null
}

export default function ProximityPrompt({ status }: Props) {
  if (status === 'locked') {
    return (
      <div className="proximity-prompt">
        <kbd className="proximity-prompt__key">T</kbd>
        <span className="proximity-prompt__label">AI-სთან საუბარი / Talk to AI</span>
      </div>
    )
  }
  return null
}
