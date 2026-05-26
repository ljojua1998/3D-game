import { usePlane } from '@react-three/cannon'
import { Plane } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import { Mesh } from 'three'
import { getFloorTexture } from '../maze/floorTexture'

const GROUND_SIZE = 1000
const TILE_WORLD_SIZE = 8

export default function GroundPlane() {
  const [ref] = usePlane<Mesh>(() => ({ type: 'Static' }), useRef<Mesh>(null!))

  const texture = useMemo(() => {
    const t = getFloorTexture().clone()
    const repeat = GROUND_SIZE / TILE_WORLD_SIZE
    t.repeat.set(repeat, repeat)
    t.needsUpdate = true
    return t
  }, [])

  return (
    <Plane ref={ref} args={[GROUND_SIZE, GROUND_SIZE, 1, 1]} receiveShadow>
      <meshStandardMaterial map={texture} color={'#ffffff'} roughness={0.78} metalness={0.08} />
    </Plane>
  )
}
