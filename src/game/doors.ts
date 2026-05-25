import { Dir } from './MazeGenerator'
import { Coord } from './pathfinding'
import { Turn } from './pathAnalysis'
import { RNG } from './rng'
import { SCENARIOS } from './scenarios'
import { CELL_SIZE } from './constants'

export type DoorStatus = 'locked' | 'cooldown' | 'answered' | 'unlocked'

export type Door = {
  id: string
  cell: Coord
  dir: Dir
  position: [number, number, number]
  orientation: 'horizontal' | 'vertical'
  status: DoorStatus
  cooldownUntil: number
  letter: string
  scenarioId: string
}

const DIR_DX: Record<Dir, number> = { N: 0, S: 0, E: 1, W: -1 }
const DIR_DY: Record<Dir, number> = { N: 1, S: -1, E: 0, W: 0 }

function shuffle<T>(rng: RNG, arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function placeDoors(turns: Turn[], count: number, rng: RNG): Door[] {
  if (turns.length === 0) return []
  let chosen: Turn[]
  if (turns.length <= count) {
    chosen = turns.slice()
  } else {
    chosen = shuffle(rng, turns).slice(0, count).sort((a, b) => a.index - b.index)
  }
  const scenarioPool = shuffle(rng, SCENARIOS).slice(0, chosen.length)
  return chosen.map((t, i) => {
    const scen = scenarioPool[i]
    const wx = t.cell.x * CELL_SIZE
    const wy = t.cell.y * CELL_SIZE
    const ex = wx + DIR_DX[t.exitDir] * (CELL_SIZE / 2)
    const ey = wy + DIR_DY[t.exitDir] * (CELL_SIZE / 2)
    return {
      id: `door-${t.cell.x}-${t.cell.y}-${t.exitDir}`,
      cell: t.cell,
      dir: t.exitDir,
      position: [ex, ey, 0],
      orientation: t.exitDir === 'N' || t.exitDir === 'S' ? 'horizontal' : 'vertical',
      status: 'locked',
      cooldownUntil: 0,
      letter: scen.letter,
      scenarioId: scen.id,
    }
  })
}

export function checkAnswer(userText: string, accept: string[]): boolean {
  const text = userText.toLowerCase().trim()
  if (!text) return false
  return accept.some(a => text.includes(a.toLowerCase().trim()))
}
