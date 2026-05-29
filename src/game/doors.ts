import { Dir } from './MazeGenerator'
import { Coord } from './pathfinding'
import { Turn } from './pathAnalysis'
import { RNG } from './rng'
import { CELL_SIZE } from './constants'
import { DoorDisplayConfig, DoorSpec, DoorType } from './puzzles'

export type DoorStatus = 'locked' | 'unlocked'

export type Door = {
  id: string
  cell: Coord
  dir: Dir
  position: [number, number, number]
  orientation: 'horizontal' | 'vertical'
  status: DoorStatus
  type: DoorType
  displayConfig: DoorDisplayConfig
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

export function placeDoors(
  turns: Turn[],
  doorSpecs: DoorSpec[],
  rng: RNG,
): Door[] {
  if (turns.length === 0 || doorSpecs.length === 0) return []
  const count = doorSpecs.length

  let chosen: Turn[]
  if (turns.length <= count) {
    chosen = turns.slice().sort((a, b) => a.index - b.index)
  } else {
    chosen = shuffle(rng, turns)
      .slice(0, count)
      .sort((a, b) => a.index - b.index)
  }

  return chosen.map((t, i) => {
    const spec = doorSpecs[i]
    const wx = t.cell.x * CELL_SIZE
    const wy = t.cell.y * CELL_SIZE
    const ex = wx + DIR_DX[t.exitDir] * (CELL_SIZE / 2)
    const ey = wy + DIR_DY[t.exitDir] * (CELL_SIZE / 2)
    return {
      id: spec.id,
      cell: t.cell,
      dir: t.exitDir,
      position: [ex, ey, 0],
      orientation: t.exitDir === 'N' || t.exitDir === 'S' ? 'horizontal' : 'vertical',
      status: 'locked',
      type: spec.type,
      displayConfig: spec.displayConfig,
    }
  })
}
