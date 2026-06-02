import { MazeGrid } from './MazeGenerator'

export type Coord = { x: number; y: number }

export function shortestPath(grid: MazeGrid): Coord[] {
  const { width, height, cells, start, end } = grid

  const visited: boolean[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => false),
  )
  const parent: (Coord | null)[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => null),
  )

  visited[start.y][start.x] = true
  const queue: Coord[] = [start]
  let head = 0

  while (head < queue.length) {
    const cur = queue[head++]
    if (cur.x === end.x && cur.y === end.y) break

    const c = cells[cur.y][cur.x]
    if (!c.walls.N && cur.y + 1 < height && !visited[cur.y + 1][cur.x]) {
      visited[cur.y + 1][cur.x] = true
      parent[cur.y + 1][cur.x] = cur
      queue.push({ x: cur.x, y: cur.y + 1 })
    }
    if (!c.walls.S && cur.y - 1 >= 0 && !visited[cur.y - 1][cur.x]) {
      visited[cur.y - 1][cur.x] = true
      parent[cur.y - 1][cur.x] = cur
      queue.push({ x: cur.x, y: cur.y - 1 })
    }
    if (!c.walls.E && cur.x + 1 < width && !visited[cur.y][cur.x + 1]) {
      visited[cur.y][cur.x + 1] = true
      parent[cur.y][cur.x + 1] = cur
      queue.push({ x: cur.x + 1, y: cur.y })
    }
    if (!c.walls.W && cur.x - 1 >= 0 && !visited[cur.y][cur.x - 1]) {
      visited[cur.y][cur.x - 1] = true
      parent[cur.y][cur.x - 1] = cur
      queue.push({ x: cur.x - 1, y: cur.y })
    }
  }

  const path: Coord[] = []
  let cur: Coord | null = end
  while (cur) {
    path.push(cur)
    cur = parent[cur.y][cur.x]
  }
  path.reverse()
  return path
}
