import { Texture } from 'three'

const DEFAULT_WIDTH = 1.8

type Props = {
  texture: Texture
  position: [number, number, number]
  rotation: [number, number, number]
  tilt: number
  width?: number
  // Width/height ratio. Defaults to the wide croco logo; pass 1 for square art.
  aspect?: number
}

export default function WallLogo({
  texture,
  position,
  rotation,
  tilt,
  width = DEFAULT_WIDTH,
  aspect = 1,
}: Props) {
  const height = width / aspect
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[0, 0, tilt]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.04}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
