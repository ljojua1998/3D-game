import { useMemo } from 'react'
import { MazeGrid } from '../../game/MazeGenerator'
import { CELL_SIZE, WALL_THICKNESS } from '../../game/constants'
import { NEON_PINK, NEON_YELLOW } from '../../theme'

const PATH_Z = 0.05 // yellow corridor traces
const WALL_Z = 0.07 // pink wall-foot lines (slightly above to read on top)
const FOOT_OFFSET = WALL_THICKNESS / 2 + 0.14 // push the line off the wall, onto the walkable side

// Neon floor lighting: a yellow trace down every corridor (follows every path)
// plus a pink line hugging the foot of every wall (follows every wall). One
// lineSegments per color so the whole grid is two draw calls.
export default function NeonFloor({ grid }: { grid: MazeGrid }) {
  const { corridor, walls, nodes } = useMemo(() => {
    const corridor: number[] = []
    const walls: number[] = []
    const nodes: number[] = []
    const NODE = 0.55 // half-size of the little junction "chip" squares
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const c = grid.cells[y][x]
        const cx = x * CELL_SIZE
        const cy = y * CELL_SIZE
        const half = CELL_SIZE / 2
        const open =
          (!c.walls.N ? 1 : 0) + (!c.walls.S ? 1 : 0) + (!c.walls.E ? 1 : 0) + (!c.walls.W ? 1 : 0)

        // --- corridor traces: center-to-center through open passages ---
        if (!c.walls.N) corridor.push(cx, cy, PATH_Z, cx, cy + CELL_SIZE, PATH_Z)
        if (!c.walls.E) corridor.push(cx, cy, PATH_Z, cx + CELL_SIZE, cy, PATH_Z)

        // --- junction "chip" square: a small outlined box where 3+ corridors meet ---
        if (open >= 3) {
          const sq: [number, number][] = [
            [cx - NODE, cy - NODE], [cx + NODE, cy - NODE],
            [cx + NODE, cy + NODE], [cx - NODE, cy + NODE],
          ]
          for (let i = 0; i < 4; i++) {
            const a = sq[i]
            const b = sq[(i + 1) % 4]
            nodes.push(a[0], a[1], PATH_Z, b[0], b[1], PATH_Z)
          }
        }

        // --- wall-foot lines: trace the base of each closed wall, offset onto
        //     the corridor side so it isn't hidden under the wall block ---
        if (c.walls.N) {
          const ly = cy + half - FOOT_OFFSET
          walls.push(cx - half, ly, WALL_Z, cx + half, ly, WALL_Z)
        }
        if (c.walls.E) {
          const lx = cx + half - FOOT_OFFSET
          walls.push(lx, cy - half, WALL_Z, lx, cy + half, WALL_Z)
        }
        if (y === 0 && c.walls.S) {
          const ly = cy - half + FOOT_OFFSET
          walls.push(cx - half, ly, WALL_Z, cx + half, ly, WALL_Z)
        }
        if (x === 0 && c.walls.W) {
          const lx = cx - half + FOOT_OFFSET
          walls.push(lx, cy - half, WALL_Z, lx, cy + half, WALL_Z)
        }
      }
    }
    return {
      corridor: new Float32Array(corridor),
      walls: new Float32Array(walls),
      nodes: new Float32Array(nodes),
    }
  }, [grid])

  return (
    <>
      {walls.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={walls}
              count={walls.length / 3}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={NEON_PINK} toneMapped={false} transparent opacity={0.95} />
        </lineSegments>
      )}
      {corridor.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={corridor}
              count={corridor.length / 3}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={NEON_YELLOW} toneMapped={false} transparent opacity={0.95} />
        </lineSegments>
      )}
      {nodes.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={nodes}
              count={nodes.length / 3}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={NEON_YELLOW} toneMapped={false} transparent opacity={1} />
        </lineSegments>
      )}
    </>
  )
}
