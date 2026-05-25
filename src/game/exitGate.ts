import { Dir, MazeGrid } from './MazeGenerator'
import { CELL_SIZE } from './constants'

export type ExitGate = {
  position: [number, number, number]
  orientation: 'horizontal' | 'vertical'
  unlocked: boolean
}

const DIR_DX: Record<Dir, number> = { N: 0, S: 0, E: 1, W: -1 }
const DIR_DY: Record<Dir, number> = { N: 1, S: -1, E: 0, W: 0 }

export function computeExitGate(grid: MazeGrid): ExitGate {
  const end = grid.cells[grid.end.y][grid.end.x]
  const openDir = (['N', 'S', 'E', 'W'] as Dir[]).find(d => !end.walls[d]) ?? 'N'
  const wx = grid.end.x * CELL_SIZE
  const wy = grid.end.y * CELL_SIZE
  const gx = wx + DIR_DX[openDir] * (CELL_SIZE / 2)
  const gy = wy + DIR_DY[openDir] * (CELL_SIZE / 2)
  return {
    position: [gx, gy, 0],
    orientation: openDir === 'N' || openDir === 'S' ? 'horizontal' : 'vertical',
    unlocked: false,
  }
}

export function validatePasscode(input: string, collected: string[]): boolean {
  if (collected.length === 0) return false
  const norm = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, '')
  const inputSorted = norm(input).split('').sort().join('')
  const expected = collected.map(c => c.toUpperCase()).sort().join('')
  return inputSorted.length === expected.length && inputSorted === expected
}
