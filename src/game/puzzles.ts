export type DoorType = 'secret-word' | 'tools'

export type ChatLanguage = 'ka' | 'en'

export type LocalizedText = { en: string; ka: string }

export type DoorDisplayConfig = {
  type: DoorType
  persona: LocalizedText
  theme: LocalizedText
}

export type InventoryItem = {
  id: string
  label: LocalizedText
  icon: string
}

export type MazeConfig = {
  width: number
  height: number
  doorCount: number
}

export type StartRunResponse = {
  sessionId: string
  doors: Array<{
    id: string
    type: DoorType
    displayConfig: DoorDisplayConfig
    unlocked?: boolean
  }>
  inventoryItems: InventoryItem[]
  // Backend-driven settings (optional for backward compat with old mock-mode runs)
  maze?: MazeConfig
  mazeSeed?: number | null
  runDurationMs?: number
  defaultLanguage?: ChatLanguage
  allowLanguageToggle?: boolean
  languages?: ChatLanguage[]
  // Resume metadata
  resumed?: boolean
  elapsedMs?: number
}

export type DoorSpec = StartRunResponse['doors'][number]

export type FinishRunResponse = {
  ok: boolean
  rank: number | null
  totalCompleted: number
  completed?: boolean
}
