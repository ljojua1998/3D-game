import { rngFromSeed, RNG } from './rng'

export type Dir = 'N' | 'S' | 'E' | 'W'

export type Walls = { N: boolean; S: boolean; E: boolean; W: boolean }

export type Cell = {
  x: number
  y: number
  walls: Walls
}

export type MazeGrid = {
  width: number
  height: number
  cells: Cell[][]
  start: { x: number; y: number }
  end: { x: number; y: number }
  seed: number
}

const OPPOSITE: Record<Dir, Dir> = { N: 'S', S: 'N', E: 'W', W: 'E' }
const DX: Record<Dir, number> = { N: 0, S: 0, E: 1, W: -1 }
const DY: Record<Dir, number> = { N: 1, S: -1, E: 0, W: 0 }

function shuffle<T>(rng: RNG, arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateMaze(
  width: number,
  height: number,
  seed: number | string | null = null,
): MazeGrid {
  const { rng, seed: resolvedSeed } = rngFromSeed(seed)

  const cells: Cell[][] = []
  for (let y = 0; y < height; y++) {
    const row: Cell[] = []
    for (let x = 0; x < width; x++) {
      row.push({ x, y, walls: { N: true, S: true, E: true, W: true } })
    }
    cells.push(row)
  }

  const visited: boolean[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => false),
  )

  const stack: Cell[] = []
  visited[0][0] = true
  stack.push(cells[0][0])

  while (stack.length > 0) {
    const current = stack[stack.length - 1]
    const dirs = shuffle(rng, ['N', 'S', 'E', 'W'] as Dir[])
    let advanced = false
    for (const d of dirs) {
      const nx = current.x + DX[d]
      const ny = current.y + DY[d]
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
      if (visited[ny][nx]) continue
      const next = cells[ny][nx]
      current.walls[d] = false
      next.walls[OPPOSITE[d]] = false
      visited[ny][nx] = true
      stack.push(next)
      advanced = true
      break
    }
    if (!advanced) stack.pop()
  }

  return {
    width,
    height,
    cells,
    start: { x: 0, y: 0 },
    end: { x: width - 1, y: height - 1 },
    seed: resolvedSeed,
  }
}
