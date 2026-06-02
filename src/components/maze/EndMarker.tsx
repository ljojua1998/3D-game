import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'
import { Icosahedron, Text } from '@react-three/drei'

type Props = {
  position: [number, number, number]
}

export default function EndMarker({ position }: Props) {
  const trophy = useRef<Mesh>(null!)

  useFrame((_, delta) => {
    if (trophy.current) {
      trophy.current.rotation.y += delta
      trophy.current.rotation.z += delta * 0.5
    }
  })

  return (
    <group position={position}>
      <pointLight position={[0, 0, 1.4]} intensity={4} distance={7} color={'#ffd76a'} />
      <Icosahedron ref={trophy} args={[0.4]} position={[0, 0, 0.9]}>
        <meshStandardMaterial
          color={'#ffcc33'}
          emissive={'#ff8800'}
          emissiveIntensity={0.6}
          metalness={0.9}
          roughness={0.15}
        />
      </Icosahedron>
      <Text
        color={'#ffd76a'}
        position={[0, 0, 1.55]}
        rotation={[Math.PI / 2, 0, 0]}
        fontSize={0.32}
        textAlign="center"
      >
        GOAL
      </Text>
    </group>
  )
}
