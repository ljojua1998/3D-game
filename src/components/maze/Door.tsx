import { useBox } from '@react-three/cannon'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import { useReducer, useRef, useEffect } from 'react'
import { Group, Mesh } from 'three'
import { Door as DoorData } from '../../game/doors'
import { CELL_SIZE, DOOR_THICKNESS, WALL_HEIGHT } from '../../game/constants'

const SIGN_Z = WALL_HEIGHT + 0.6
const COLOR_LOCKED = '#c83a3a'
const COLOR_COOLDOWN = '#5a2727'
const COLOR_ANSWERED = '#e0b73f'
const COLOR_UNLOCKED = '#6cff9b'

type Props = {
  door: DoorData
  isNearby: boolean
}

function doorArgs(d: DoorData): [number, number, number] {
  return d.orientation === 'horizontal'
    ? [CELL_SIZE, DOOR_THICKNESS, WALL_HEIGHT]
    : [DOOR_THICKNESS, CELL_SIZE, WALL_HEIGHT]
}

function doorColor(status: DoorData['status']): string {
  switch (status) {
    case 'locked': return COLOR_LOCKED
    case 'cooldown': return COLOR_COOLDOWN
    case 'answered': return COLOR_ANSWERED
    case 'unlocked': return COLOR_UNLOCKED
  }
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
  const color = doorColor(door.status)
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.18}
        metalness={0.2}
        roughness={0.4}
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
        color={COLOR_UNLOCKED}
        emissive={COLOR_UNLOCKED}
        emissiveIntensity={0.45}
        transparent
        opacity={0.18}
      />
    </mesh>
  )
}

function DoorSign({ door, isNearby }: Props) {
  const group = useRef<Group>(null!)
  const [, force] = useReducer((s: number) => s + 1, 0)

  useEffect(() => {
    if (door.status !== 'cooldown') return
    const id = setInterval(force, 250)
    return () => clearInterval(id)
  }, [door.status])

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

  let text: string
  let color: string
  let pre: string | null = null
  if (door.status === 'locked') {
    text = '?'
    color = '#ffffff'
  } else if (door.status === 'cooldown') {
    const left = Math.max(0, Math.ceil((door.cooldownUntil - Date.now()) / 1000))
    text = `${left}s`
    color = '#ff7b7b'
  } else {
    text = door.letter
    color = '#14171f'
    pre = 'U'
  }

  const z = door.position[2] + SIGN_Z

  return (
    <Billboard position={[door.position[0], door.position[1], z]}>
      <group ref={group}>
        <Text
          fontSize={0.55}
          color={color}
          outlineWidth={0.04}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
        >
          {text}
        </Text>
        {pre && (
          <Text
            position={[0, -0.55, 0]}
            fontSize={0.18}
            color="#ffcc33"
            outlineWidth={0.02}
            outlineColor="#000000"
            anchorX="center"
            anchorY="middle"
          >
            [{pre}] open
          </Text>
        )}
      </group>
    </Billboard>
  )
}

export default function Door({ door, isNearby }: Props) {
  const hasCollider = door.status === 'locked' || door.status === 'cooldown' || door.status === 'answered'
  return (
    <>
      {hasCollider ? <DoorPhysicsMesh door={door} /> : <DoorGhostMesh door={door} />}
      <DoorSign door={door} isNearby={isNearby} />
    </>
  )
}
