import { Dir, MazeGrid } from './MazeGenerator'
import { Door } from './doors'

export const ZONE_COLORS = [
  '#f4e6c8',
  '#c8e6cf',
  '#c8d8f4',
  '#e6c8ec',
  '#f4d6c8',
  '#e8e8c8',
]

const DX: Record<Dir, number> = { N: 0, S: 0, E: 1, W: -1 }
const DY: Record<Dir, number> = { N: 1, S: -1, E: 0, W: 0 }

const cellKey = (x: number, y: number) => `${x},${y}`
const edgeKey = (ax: number, ay: number, bx: number, by: number) =>
  ax < bx || (ax === bx && ay < by)
    ? `${ax},${ay}|${bx},${by}`
    : `${bx},${by}|${ax},${ay}`

export function computeZones(grid: MazeGrid, doors: Door[]): Map<string, number> {
  const doorEdges = new Set<string>()
  for (const d of doors) {
    const nx = d.cell.x + DX[d.dir]
    const ny = d.cell.y + DY[d.dir]
    doorEdges.add(edgeKey(d.cell.x, d.cell.y, nx, ny))
  }

  const zones = new Map<string, number>()
  const visited = new Set<string>()
  const queue: { x: number; y: number; zone: number }[] = []
  const sk = cellKey(grid.start.x, grid.start.y)
  queue.push({ x: grid.start.x, y: grid.start.y, zone: 0 })
  zones.set(sk, 0)
  visited.add(sk)

  while (queue.length > 0) {
    const { x, y, zone } = queue.shift()!
    const c = grid.cells[y][x]
    for (const dir of ['N', 'S', 'E', 'W'] as Dir[]) {
      if (c.walls[dir]) continue
      const nx = x + DX[dir]
      const ny = y + DY[dir]
      const nk = cellKey(nx, ny)
      if (visited.has(nk)) continue
      visited.add(nk)
      const crossed = doorEdges.has(edgeKey(x, y, nx, ny)) ? 1 : 0
      const z = zone + crossed
      zones.set(nk, z)
      queue.push({ x: nx, y: ny, zone: z })
    }
  }
  return zones
}

export function zoneColorFor(zoneIndex: number | undefined): string {
  if (zoneIndex === undefined) return ZONE_COLORS[0]
  return ZONE_COLORS[zoneIndex % ZONE_COLORS.length]
}
