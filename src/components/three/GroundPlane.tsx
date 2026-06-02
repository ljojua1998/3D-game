import { usePlane } from '@react-three/cannon'
import { Plane } from '@react-three/drei'
import { useRef } from 'react'
import { Mesh } from 'three'

const GROUND_SIZE = 1000

export default function GroundPlane() {
  const [ref] = usePlane<Mesh>(() => ({ type: 'Static' }), useRef<Mesh>(null!))

  return (
    <Plane ref={ref} args={[GROUND_SIZE, GROUND_SIZE, 1, 1]} receiveShadow>
      <meshStandardMaterial color={'#f9f9f9'} roughness={0.78} metalness={0.08} />
    </Plane>
  )
}
