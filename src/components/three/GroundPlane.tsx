import { usePlane } from '@react-three/cannon'
import { Plane } from '@react-three/drei'
import { useRef } from 'react'
import { Mesh } from 'three'
import { GROUND_COLOR } from '../../theme'

export default function GroundPlane() {
  const [ref] = usePlane<Mesh>(() => ({ type: 'Static' }), useRef<Mesh>(null!))

  return (
    <Plane ref={ref} args={[1000, 1000, 1000, 1000]} receiveShadow>
      <meshPhongMaterial color={GROUND_COLOR}/>
    </Plane>
  )
}
