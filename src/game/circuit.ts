import { mulberry32 } from './rng'

// Procedural PCB-style neon traces inside a w×h rectangle (local 2D plane).
// Returns a flat list of 2D segment endpoints: [x0,y0,x1,y1, ...] with
// x in [0,w], y in [0,h]. Traces wander with right-angle bends, occasionally
// close into a small rectangle, then terminate — like circuit-board routing.
// Deterministic in `seed`.
export function circuit2D(w: number, h: number, seed: number, density = 0.55): number[] {
  const rng = mulberry32(seed >>> 0)
  const step = 0.32
  const margin = 0.18
  const segs: number[] = []
  const dirs: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
  const inb = (x: number, y: number) =>
    x >= margin && x <= w - margin && y >= margin && y <= h - margin

  const traceCount = Math.max(2, Math.round(w * h * density))

  for (let t = 0; t < traceCount; t++) {
    let x = margin + rng() * (w - 2 * margin)
    let y = margin + rng() * (h - 2 * margin)
    let di = Math.floor(rng() * 4)
    const len = 5 + Math.floor(rng() * 9)

    // small pad square at the start
    pushPad(segs, x, y, step * 0.5)

    for (let i = 0; i < len; i++) {
      if (rng() < 0.38) {
        // turn 90° left or right
        di = (di + (rng() < 0.5 ? 1 : 3)) % 4
      }
      let nx = x + dirs[di][0] * step
      let ny = y + dirs[di][1] * step
      if (!inb(nx, ny)) {
        di = (di + 2) % 4
        nx = x + dirs[di][0] * step
        ny = y + dirs[di][1] * step
        if (!inb(nx, ny)) break
      }
      segs.push(x, y, nx, ny)
      x = nx
      y = ny

      // occasionally spawn a small rectangle and end the trace
      if (rng() < 0.1) {
        const rw = step * (2 + Math.floor(rng() * 3))
        const rh = step * (2 + Math.floor(rng() * 3))
        if (inb(x + rw, y + rh)) {
          segs.push(x, y, x + rw, y)
          segs.push(x + rw, y, x + rw, y + rh)
          segs.push(x + rw, y + rh, x, y + rh)
          segs.push(x, y + rh, x, y)
        }
        break
      }
    }
    // pad at the end
    pushPad(segs, x, y, step * 0.5)
  }
  return segs
}

function pushPad(segs: number[], cx: number, cy: number, hs: number): void {
  segs.push(cx - hs, cy - hs, cx + hs, cy - hs)
  segs.push(cx + hs, cy - hs, cx + hs, cy + hs)
  segs.push(cx + hs, cy + hs, cx - hs, cy + hs)
  segs.push(cx - hs, cy + hs, cx - hs, cy - hs)
}
