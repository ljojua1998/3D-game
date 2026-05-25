import { useBox } from '@react-three/cannon'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import { useRef } from 'react'
import { Group, Mesh } from 'three'
import { ExitGate as ExitGateData } from '../../game/exitGate'
import { CELL_SIZE, DOOR_THICKNESS, WALL_HEIGHT } from '../../game/constants'

const GATE_LOCKED = '#8c39ff'
const GATE_READY = '#ffcc33'
const GATE_UNLOCKED = '#6cff9b'
const SIGN_Z = WALL_HEIGHT + 0.8

type Props = {
  gate: ExitGateData
  isNearby: boolean
  hasAllLetters: boolean
}

function gateArgs(g: ExitGateData): [number, number, number] {
  return g.orientation === 'horizontal'
    ? [CELL_SIZE, DOOR_THICKNESS, WALL_HEIGHT]
    : [DOOR_THICKNESS, CELL_SIZE, WALL_HEIGHT]
}

function GateBlockingMesh({ gate, color }: { gate: ExitGateData; color: string }) {
  const args = gateArgs(gate)
  const center: [number, number, number] = [
    gate.position[0],
    gate.position[1],
    gate.position[2] + WALL_HEIGHT / 2,
  ]
  const [ref] = useBox<Mesh>(() => ({
    type: 'Static',
    args,
    position: center,
  }))
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.55}
        metalness={0.3}
        roughness={0.25}
      />
    </mesh>
  )
}

function GateGhostMesh({ gate }: { gate: ExitGateData }) {
  const args = gateArgs(gate)
  const center: [number, number, number] = [
    gate.position[0],
    gate.position[1],
    gate.position[2] + WALL_HEIGHT / 2,
  ]
  return (
    <mesh position={center}>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={GATE_UNLOCKED}
        emissive={GATE_UNLOCKED}
        emissiveIntensity={0.6}
        transparent
        opacity={0.2}
      />
    </mesh>
  )
}

function GateSign({ gate, isNearby, hasAllLetters }: Props) {
  const group = useRef<Group>(null!)
  useFrame(({ clock }) => {
    if (!group.current) return
    if (isNearby && !gate.unlocked) {
      const s = 1 + 0.18 * Math.sin(clock.elapsedTime * 4)
      group.current.scale.set(s, s, s)
    } else {
      group.current.scale.set(1, 1, 1)
    }
  })

  if (gate.unlocked) return null

  const title = hasAllLetters ? 'EXIT' : 'LOCKED'
  const sub = hasAllLetters ? '[E] enter passcode' : 'collect all letters'
  const titleColor = hasAllLetters ? GATE_READY : '#ff7b7b'

  return (
    <Billboard position={[gate.position[0], gate.position[1], gate.position[2] + SIGN_Z]}>
      <group ref={group}>
        <Text
          fontSize={0.55}
          color={titleColor}
          outlineWidth={0.04}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
        >
          {title}
        </Text>
        <Text
          position={[0, -0.55, 0]}
          fontSize={0.2}
          color="#ffcc33"
          outlineWidth={0.02}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
        >
          {sub}
        </Text>
      </group>
    </Billboard>
  )
}

export default function ExitGate(props: Props) {
  const color = props.hasAllLetters ? GATE_READY : GATE_LOCKED
  return (
    <>
      {props.gate.unlocked ? (
        <GateGhostMesh gate={props.gate} />
      ) : (
        <GateBlockingMesh gate={props.gate} color={color} />
      )}
      <GateSign {...props} />
    </>
  )
}
