import { Door } from './doors'

export type GameState = {
  doors: Door[]
  won: boolean
}

export const gameState: GameState = {
  doors: [],
  won: false,
}

export function syncGameState(patch: Partial<GameState>): void {
  Object.assign(gameState, patch)
}
