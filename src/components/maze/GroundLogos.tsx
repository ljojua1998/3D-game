import { useMemo } from 'react'
import { Texture } from 'three'
import { MazeGrid } from '../../game/MazeGenerator'
import { mulberry32 } from '../../game/rng'
import { CELL_SIZE } from '../../game/constants'
import { LOGO_ASPECT } from './logoTexture'

const LOGO_WIDTH = 1.6
const GROUND_OFFSET_Z = 0.015
const DENSITY = 0.18

type Props = {
  grid: MazeGrid
  texture: Texture | null
}

type Placement = {
  pos: [number, number, number]
  rot: number
}

export default function GroundLogos({ grid, texture }: Props) {
  const placements = useMemo<Placement[]>(() => {
    const rng = mulberry32((grid.seed * 31 + 7) >>> 0)
    const out: Placement[] = []
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        if (x === grid.start.x && y === grid.start.y) continue
        if (x === grid.end.x && y === grid.end.y) continue
        if (rng() > DENSITY) continue
        const jitterX = (rng() - 0.5) * CELL_SIZE * 0.3
        const jitterY = (rng() - 0.5) * CELL_SIZE * 0.3
        const rot = rng() * Math.PI * 2
        out.push({
          pos: [x * CELL_SIZE + jitterX, y * CELL_SIZE + jitterY, GROUND_OFFSET_Z],
          rot,
        })
      }
    }
    return out
  }, [grid])

  if (!texture) return null

  const h = LOGO_WIDTH / LOGO_ASPECT
  return (
    <>
      {placements.map((p, i) => (
        <mesh key={i} position={p.pos} rotation={[0, 0, p.rot]}>
          <planeGeometry args={[LOGO_WIDTH, h]} />
          <meshBasicMaterial
            map={texture}
            transparent
            alphaTest={0.04}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  )
}
