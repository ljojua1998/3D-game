import { Dir } from './MazeGenerator'
import { Coord } from './pathfinding'
import { Turn } from './pathAnalysis'
import { RNG } from './rng'
import { CELL_SIZE } from './constants'

export type DoorState = 'locked' | 'unlocked'

export type Door = {
  id: string
  cell: Coord
  dir: Dir
  position: [number, number, number]
  orientation: 'horizontal' | 'vertical'
  state: DoorState
  letter: string
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
  return chosen.map(t => {
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
      state: 'locked',
      letter: '',
    }
  })
}
