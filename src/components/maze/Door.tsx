import { useBox } from '@react-three/cannon'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import { Group, Mesh } from 'three'
import { Door as DoorData } from '../../game/doors'
import { CELL_SIZE, DOOR_THICKNESS, WALL_HEIGHT } from '../../game/constants'
import { getWoodTexture } from './doorTexture'

const SIGN_Z = WALL_HEIGHT + 0.6
const COLOR_GHOST = '#9bd07a'

type Props = {
  door: DoorData
  isNearby: boolean
}

function doorArgs(d: DoorData): [number, number, number] {
  return d.orientation === 'horizontal'
    ? [CELL_SIZE, DOOR_THICKNESS, WALL_HEIGHT]
    : [DOOR_THICKNESS, CELL_SIZE, WALL_HEIGHT]
}

function DoorPhysicsMesh({ door }: { door: DoorData }) {
  const args = doorArgs(door)
  const center: [number, number, number] = [
    door.position[0],
    door.position[1],
    door.position[2] + WALL_HEIGHT / 2,
  ]
  const [ref] = useBox<Mesh>(() => ({
    type: 'Static',
    args,
    position: center,
  }))

  const texture = useMemo(() => {
    const t = getWoodTexture().clone()
    t.repeat.set(1, 1)
    t.needsUpdate = true
    return t
  }, [])

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        map={texture}
        color={'#d8c4a8'}
        roughness={0.78}
        metalness={0.06}
      />
    </mesh>
  )
}

function DoorGhostMesh({ door }: { door: DoorData }) {
  const args = doorArgs(door)
  const center: [number, number, number] = [
    door.position[0],
    door.position[1],
    door.position[2] + WALL_HEIGHT / 2,
  ]
  return (
    <mesh position={center}>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={COLOR_GHOST}
        emissive={COLOR_GHOST}
        emissiveIntensity={0.4}
        transparent
        opacity={0.16}
      />
    </mesh>
  )
}

function DoorSign({ door, isNearby }: Props) {
  const group = useRef<Group>(null!)

  useFrame(({ clock }) => {
    if (!group.current) return
    if (isNearby && door.status === 'locked') {
      const s = 1 + 0.18 * Math.sin(clock.elapsedTime * 4)
      group.current.scale.set(s, s, s)
    } else {
      group.current.scale.set(1, 1, 1)
    }
  })

  if (door.status === 'unlocked') return null

  const z = door.position[2] + SIGN_Z

  return (
    <Billboard position={[door.position[0], door.position[1], z]}>
      <group ref={group}>
        <Text
          fontSize={0.55}
          color={'#f4e6c8'}
          outlineWidth={0.04}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
        >
          ?
        </Text>
        <Text
          position={[0, -0.55, 0]}
          fontSize={0.18}
          color="#ffcc33"
          outlineWidth={0.02}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
        >
          [T] talk
        </Text>
      </group>
    </Billboard>
  )
}

export default function Door({ door, isNearby }: Props) {
  const locked = door.status === 'locked'
  return (
    <>
      {locked ? <DoorPhysicsMesh door={door} /> : <DoorGhostMesh door={door} />}
      <DoorSign door={door} isNearby={isNearby} />
    </>
  )
}
