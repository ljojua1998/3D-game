// Sanity test: generate N mazes, report path/turn-count distribution.
// Compares "any direction change" vs "decisive turn" (junction on path).

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle(rng, arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' }
const DX = { N: 0, S: 0, E: 1, W: -1 }
const DY = { N: 1, S: -1, E: 0, W: 0 }

function generateMaze(W, H, seed) {
  const rng = mulberry32(seed)
  const cells = []
  for (let y = 0; y < H; y++) {
    const row = []
    for (let x = 0; x < W; x++) row.push({ x, y, walls: { N: true, S: true, E: true, W: true } })
    cells.push(row)
  }
  const visited = Array.from({ length: H }, () => Array.from({ length: W }, () => false))
  const stack = [cells[0][0]]
  visited[0][0] = true
  while (stack.length) {
    const cur = stack[stack.length - 1]
    const dirs = shuffle(rng, ['N', 'S', 'E', 'W'])
    let advanced = false
    for (const d of dirs) {
      const nx = cur.x + DX[d], ny = cur.y + DY[d]
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
      if (visited[ny][nx]) continue
      cur.walls[d] = false
      cells[ny][nx].walls[OPP[d]] = false
      visited[ny][nx] = true
      stack.push(cells[ny][nx])
      advanced = true
      break
    }
    if (!advanced) stack.pop()
  }
  return { W, H, cells, start: { x: 0, y: 0 }, end: { x: W - 1, y: H - 1 } }
}

function shortestPath(g) {
  const { W, H, cells, start, end } = g
  const visited = Array.from({ length: H }, () => Array.from({ length: W }, () => false))
  const parent = Array.from({ length: H }, () => Array.from({ length: W }, () => null))
  visited[start.y][start.x] = true
  const q = [start]
  let head = 0
  while (head < q.length) {
    const c = q[head++]
    if (c.x === end.x && c.y === end.y) break
    const cell = cells[c.y][c.x]
    const neigh = [
      !cell.walls.N && c.y + 1 < H ? { x: c.x, y: c.y + 1 } : null,
      !cell.walls.S && c.y - 1 >= 0 ? { x: c.x, y: c.y - 1 } : null,
      !cell.walls.E && c.x + 1 < W ? { x: c.x + 1, y: c.y } : null,
      !cell.walls.W && c.x - 1 >= 0 ? { x: c.x - 1, y: c.y } : null,
    ]
    for (const n of neigh) {
      if (!n || visited[n.y][n.x]) continue
      visited[n.y][n.x] = true
      parent[n.y][n.x] = c
      q.push(n)
    }
  }
  const path = []
  let c = end
  while (c) { path.push(c); c = parent[c.y][c.x] }
  path.reverse()
  return path
}

function dirBetween(a, b) {
  if (b.y > a.y) return 'N'
  if (b.y < a.y) return 'S'
  if (b.x > a.x) return 'E'
  return 'W'
}

function openCount(cell) {
  let n = 0
  if (!cell.walls.N) n++
  if (!cell.walls.S) n++
  if (!cell.walls.E) n++
  if (!cell.walls.W) n++
  return n
}

function getAllTurns(path) {
  const t = []
  for (let i = 1; i < path.length - 1; i++) {
    if (dirBetween(path[i - 1], path[i]) !== dirBetween(path[i], path[i + 1])) t.push(i)
  }
  return t
}

function getDecisiveTurns(path, grid) {
  // junction = cell with 3+ open passages (player has a real choice)
  const t = []
  for (let i = 1; i < path.length - 1; i++) {
    const cell = grid.cells[path[i].y][path[i].x]
    if (openCount(cell) >= 3) t.push(i)
  }
  return t
}

function getJunctionTurns(path, grid) {
  // junction AND direction changes (subset of allTurns AND of decisiveTurns)
  const t = []
  for (let i = 1; i < path.length - 1; i++) {
    const cell = grid.cells[path[i].y][path[i].x]
    if (openCount(cell) < 3) continue
    if (dirBetween(path[i - 1], path[i]) === dirBetween(path[i], path[i + 1])) continue
    t.push(i)
  }
  return t
}

function summarize(label, arr) {
  arr.sort((a, b) => a - b)
  const N = arr.length
  const avg = arr.reduce((a, b) => a + b, 0) / N
  console.log(`${label.padEnd(22)} avg=${avg.toFixed(1).padStart(5)}  min=${String(arr[0]).padStart(2)}  p50=${String(arr[Math.floor(N / 2)]).padStart(2)}  p90=${String(arr[Math.floor(N * 0.9)]).padStart(2)}  max=${arr[N - 1]}`)
}

function runSize(W, H, N) {
  const all = [], decisive = [], jt = []
  for (let s = 1; s <= N; s++) {
    const g = generateMaze(W, H, s * 1000003)
    const p = shortestPath(g)
    all.push(getAllTurns(p).length)
    decisive.push(getDecisiveTurns(p, g).length)
    jt.push(getJunctionTurns(p, g).length)
  }
  console.log(`\n=== ${W}×${H} (n=${N}) ===`)
  summarize('any direction change', all)
  summarize('cell with 3+ openings', decisive)
  summarize('junction + dir change', jt)
}

runSize(6, 6, 200)
runSize(8, 8, 200)
runSize(10, 10, 200)
runSize(12, 12, 200)

// Phase 2 sanity: after auto-regen (MIN_TURNS=3), door distribution at DOOR_COUNT=4
function generateValidMaze(W, H, baseSeed) {
  const MIN_TURNS = 3
  let s = baseSeed
  for (let i = 0; i < 50; i++) {
    const g = generateMaze(W, H, s * 1000003)
    const t = getDecisiveTurns(shortestPath(g), g)
    if (t.length >= MIN_TURNS) return { g, attempts: i + 1, turns: t.length }
    s = baseSeed + i * 7919
  }
  const g = generateMaze(W, H, s * 1000003)
  return { g, attempts: 50, turns: getDecisiveTurns(shortestPath(g), g).length }
}

const DOOR_COUNT = 4
const attempts = []
const placedDoors = []
for (let s = 1; s <= 200; s++) {
  const { turns, attempts: a } = generateValidMaze(10, 10, s)
  attempts.push(a)
  placedDoors.push(Math.min(turns, DOOR_COUNT))
}
console.log(`\n=== Phase 2: auto-regen + 4 doors @ 10×10 ===`)
summarize('regen attempts', attempts)
summarize('doors placed', placedDoors)
const fourCount = placedDoors.filter(d => d === DOOR_COUNT).length
console.log(`${fourCount}/${placedDoors.length} mazes got full ${DOOR_COUNT} doors`)
