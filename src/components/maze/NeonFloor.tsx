import { useMemo } from 'react'
import { MazeGrid } from '../../game/MazeGenerator'
import { circuit2D } from '../../game/circuit'
import { CELL_SIZE, WALL_THICKNESS } from '../../game/constants'
import { NEON_PINK, NEON_YELLOW } from '../../theme'

const CIRCUIT_Z = 0.05 // decorative circuit field (background)
const WALL_Z = 0.07 // pink wall-foot lines
const CORRIDOR_Z = 0.09 // bright center line down every corridor (on top)
const FOOT_OFFSET = WALL_THICKNESS / 2 + 0.14
const FLOOR_DENSITY = 0.085 // circuit traces per world unit² — sparse

// Neon floor: winding PCB circuit traces (yellow) routed across the whole
// floor — the same bend/rectangle/terminate style as the walls — plus a pink
// line hugging the foot of every wall so the maze structure still reads.
export default function NeonFloor({ grid }: { grid: MazeGrid }) {
  const circuit = useMemo(() => {
    const fw = grid.width * CELL_SIZE
    const fh = grid.height * CELL_SIZE
    const segs = circuit2D(fw, fh, grid.seed >>> 0, FLOOR_DENSITY)
    // Map 2D field → world floor. u=0 is the left edge of cell 0 (-CELL/2).
    const pts: number[] = []
    for (let i = 0; i < segs.length; i += 4) {
      pts.push(segs[i] - CELL_SIZE / 2, segs[i + 1] - CELL_SIZE / 2, CIRCUIT_Z)
      pts.push(segs[i + 2] - CELL_SIZE / 2, segs[i + 3] - CELL_SIZE / 2, CIRCUIT_Z)
    }
    return new Float32Array(pts)
  }, [grid])

  // Bright center line running down every corridor (center-to-center through
  // open passages) — the guide line that follows the maze on every side.
  const corridor = useMemo(() => {
    const out: number[] = []
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const c = grid.cells[y][x]
        const cx = x * CELL_SIZE
        const cy = y * CELL_SIZE
        if (!c.walls.N) out.push(cx, cy, CORRIDOR_Z, cx, cy + CELL_SIZE, CORRIDOR_Z)
        if (!c.walls.E) out.push(cx, cy, CORRIDOR_Z, cx + CELL_SIZE, cy, CORRIDOR_Z)
      }
    }
    return new Float32Array(out)
  }, [grid])

  const walls = useMemo(() => {
    const out: number[] = []
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const c = grid.cells[y][x]
        const cx = x * CELL_SIZE
        const cy = y * CELL_SIZE
        const half = CELL_SIZE / 2
        if (c.walls.N) {
          const ly = cy + half - FOOT_OFFSET
          out.push(cx - half, ly, WALL_Z, cx + half, ly, WALL_Z)
        }
        if (c.walls.E) {
          const lx = cx + half - FOOT_OFFSET
          out.push(lx, cy - half, WALL_Z, lx, cy + half, WALL_Z)
        }
        if (y === 0 && c.walls.S) {
          const ly = cy - half + FOOT_OFFSET
          out.push(cx - half, ly, WALL_Z, cx + half, ly, WALL_Z)
        }
        if (x === 0 && c.walls.W) {
          const lx = cx - half + FOOT_OFFSET
          out.push(lx, cy - half, WALL_Z, lx, cy + half, WALL_Z)
        }
      }
    }
    return new Float32Array(out)
  }, [grid])

  return (
    <>
      {walls.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" array={walls} count={walls.length / 3} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial color={NEON_PINK} toneMapped={false} transparent opacity={0.95} />
        </lineSegments>
      )}
      {circuit.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" array={circuit} count={circuit.length / 3} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial color={NEON_YELLOW} toneMapped={false} transparent opacity={0.45} />
        </lineSegments>
      )}
      {corridor.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" array={corridor} count={corridor.length / 3} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial color={NEON_YELLOW} toneMapped={false} transparent opacity={1} />
        </lineSegments>
      )}
    </>
  )
}
