import { useBox } from '@react-three/cannon'
import { Mesh } from 'three'
import { WALL_COLOR } from '../../theme'
import { CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS } from '../../game/constants'

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
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshPhongMaterial color={WALL_COLOR} />
    </mesh>
  )
}
