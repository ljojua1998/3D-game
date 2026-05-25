import { Door } from './doors'

export type GameState = {
  doors: Door[]
  collectedLetters: string[]
  won: boolean
}

export const gameState: GameState = {
  doors: [],
  collectedLetters: [],
  won: false,
}

export function syncGameState(patch: Partial<GameState>): void {
  Object.assign(gameState, patch)
}
