import { Coord } from './pathfinding'
import { Dir, MazeGrid } from './MazeGenerator'

export type Turn = {
  cell: Coord
  prevDir: Dir
  exitDir: Dir
  index: number
  openCount: number
}

function dirBetween(from: Coord, to: Coord): Dir {
  if (to.y > from.y) return 'N'
  if (to.y < from.y) return 'S'
  if (to.x > from.x) return 'E'
  return 'W'
}

function openPassages(grid: MazeGrid, c: Coord): number {
  const cell = grid.cells[c.y][c.x]
  let n = 0
  if (!cell.walls.N) n++
  if (!cell.walls.S) n++
  if (!cell.walls.E) n++
  if (!cell.walls.W) n++
  return n
}

export function getTurns(path: Coord[], grid: MazeGrid): Turn[] {
  const turns: Turn[] = []
  for (let i = 1; i < path.length - 1; i++) {
    const opens = openPassages(grid, path[i])
    if (opens < 3) continue
    const prevDir = dirBetween(path[i - 1], path[i])
    const exitDir = dirBetween(path[i], path[i + 1])
    turns.push({ cell: path[i], prevDir, exitDir, index: i, openCount: opens })
  }
  return turns
}
