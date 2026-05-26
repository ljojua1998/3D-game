import { useBox } from '@react-three/cannon'
import { useMemo } from 'react'
import { Mesh, Texture } from 'three'
import { CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS } from '../../game/constants'
import { getStoneTexture } from './wallTexture'
import WallLogo from './WallLogo'

export { CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS }

const LOGO_OFFSET = 0.02

type WallProps = {
  position: [number, number, number]
  orientation: 'horizontal' | 'vertical'
  tint?: string
  logo?: Texture | null
}

function hashAngle(x: number, y: number, z: number, salt: number): number {
  let h = Math.imul(Math.round(x * 100) | 0, 73856093)
  h ^= Math.imul(Math.round(y * 100) | 0, 19349663)
  h ^= Math.imul(Math.round(z * 100) | 0, 83492791)
  h ^= salt * 2654435761
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  h ^= h >>> 16
  return ((h >>> 0) / 0xffffffff) * Math.PI * 2
}

export default function Wall({ position, orientation, tint = '#ffffff', logo }: WallProps) {
  const args: [number, number, number] =
    orientation === 'horizontal'
      ? [CELL_SIZE, WALL_THICKNESS, WALL_HEIGHT]
      : [WALL_THICKNESS, CELL_SIZE, WALL_HEIGHT]
  const center: [number, number, number] = [position[0], position[1], position[2] + WALL_HEIGHT / 2]
  const [ref] = useBox<Mesh>(() => ({
    type: 'Static',
    args,
    position: center,
  }))

  const texture = useMemo(() => {
    const t = getStoneTexture().clone()
    t.repeat.set(CELL_SIZE / 2, WALL_HEIGHT / 2)
    t.needsUpdate = true
    return t
  }, [])

  const tiltFront = useMemo(
    () => hashAngle(position[0], position[1], position[2], 1),
    [position],
  )
  const tiltBack = useMemo(
    () => hashAngle(position[0], position[1], position[2], 2),
    [position],
  )

  const halfT = WALL_THICKNESS / 2
  const faceZ = position[2] + WALL_HEIGHT / 2

  return (
    <>
      <mesh ref={ref} castShadow receiveShadow>
        <boxGeometry args={args} />
        <meshStandardMaterial map={texture} color={tint} roughness={0.86} metalness={0.04} />
      </mesh>
      {logo && orientation === 'horizontal' && (
        <>
          <WallLogo
            texture={logo}
            position={[position[0], position[1] + halfT + LOGO_OFFSET, faceZ]}
            rotation={[-Math.PI / 2, 0, 0]}
            tilt={tiltFront}
          />
          <WallLogo
            texture={logo}
            position={[position[0], position[1] - halfT - LOGO_OFFSET, faceZ]}
            rotation={[Math.PI / 2, 0, 0]}
            tilt={tiltBack}
          />
        </>
      )}
      {logo && orientation === 'vertical' && (
        <>
          <WallLogo
            texture={logo}
            position={[position[0] + halfT + LOGO_OFFSET, position[1], faceZ]}
            rotation={[0, Math.PI / 2, 0]}
            tilt={tiltFront}
          />
          <WallLogo
            texture={logo}
            position={[position[0] - halfT - LOGO_OFFSET, position[1], faceZ]}
            rotation={[0, -Math.PI / 2, 0]}
            tilt={tiltBack}
          />
        </>
      )}
    </>
  )
}
