import { useBox } from '@react-three/cannon'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import { useReducer, useRef, useEffect, useMemo } from 'react'
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

function statusEmissive(status: DoorData['status']): { color: string; intensity: number } {
  switch (status) {
    case 'locked':
      return { color: '#000000', intensity: 0 }
    case 'cooldown':
      return { color: '#7a1818', intensity: 0.35 }
    case 'answered':
      return { color: '#8a5a18', intensity: 0.55 }
    case 'unlocked':
      return { color: '#000000', intensity: 0 }
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

  const texture = useMemo(() => {
    const t = getWoodTexture().clone()
    t.repeat.set(1, 1)
    t.needsUpdate = true
    return t
  }, [])

  const { color: emissiveColor, intensity } = statusEmissive(door.status)

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        map={texture}
        color={'#d8c4a8'}
        emissive={emissiveColor}
        emissiveIntensity={intensity}
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
    color = '#f4e6c8'
  } else if (door.status === 'cooldown') {
    const left = Math.max(0, Math.ceil((door.cooldownUntil - Date.now()) / 1000))
    text = `${left}s`
    color = '#ff9b7b'
  } else {
    text = door.letter
    color = '#fff1c8'
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
  const hasCollider =
    door.status === 'locked' || door.status === 'cooldown' || door.status === 'answered'
  return (
    <>
      {hasCollider ? <DoorPhysicsMesh door={door} /> : <DoorGhostMesh door={door} />}
      <DoorSign door={door} isNearby={isNearby} />
    </>
  )
}
