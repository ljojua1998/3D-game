import { useBox } from '@react-three/cannon'
import { useMemo } from 'react'
import { Mesh } from 'three'
import { CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS } from '../../game/constants'
import { getStoneTexture } from './wallTexture'

export { CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS }

type WallProps = {
  position: [number, number, number]
  orientation: 'horizontal' | 'vertical'
}

export default function Wall({ position, orientation }: WallProps) {
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

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial map={texture} roughness={0.88} metalness={0.04} />
    </mesh>
  )
}
