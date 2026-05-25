import { useBox } from '@react-three/cannon'
import { Mesh } from 'three'
import { Door as DoorData } from '../../game/doors'
import { CELL_SIZE, DOOR_THICKNESS, WALL_HEIGHT } from '../../game/constants'

const LOCKED_COLOR = '#c83a3a'
const UNLOCKED_COLOR = '#6cff9b'

function doorArgs(d: DoorData): [number, number, number] {
  return d.orientation === 'horizontal'
    ? [CELL_SIZE, DOOR_THICKNESS, WALL_HEIGHT]
    : [DOOR_THICKNESS, CELL_SIZE, WALL_HEIGHT]
}

function LockedDoor({ door }: { door: DoorData }) {
  const args = doorArgs(door)
  const center: [number, number, number] = [door.position[0], door.position[1], door.position[2] + WALL_HEIGHT / 2]
  const [ref] = useBox<Mesh>(() => ({
    type: 'Static',
    args,
    position: center,
  }))
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={LOCKED_COLOR}
        emissive={LOCKED_COLOR}
        emissiveIntensity={0.18}
        metalness={0.2}
        roughness={0.4}
      />
    </mesh>
  )
}

function UnlockedDoor({ door }: { door: DoorData }) {
  const args = doorArgs(door)
  const center: [number, number, number] = [door.position[0], door.position[1], door.position[2] + WALL_HEIGHT / 2]
  return (
    <mesh position={center}>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={UNLOCKED_COLOR}
        emissive={UNLOCKED_COLOR}
        emissiveIntensity={0.5}
        transparent
        opacity={0.28}
      />
    </mesh>
  )
}

export default function Door({ door }: { door: DoorData }) {
  return door.state === 'locked' ? <LockedDoor door={door} /> : <UnlockedDoor door={door} />
}
