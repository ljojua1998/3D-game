import { Texture } from 'three'
import { LOGO_ASPECT } from './logoTexture'

const DEFAULT_WIDTH = 1.8

type Props = {
  texture: Texture
  position: [number, number, number]
  rotation: [number, number, number]
  tilt: number
  width?: number
}

export default function WallLogo({
  texture,
  position,
  rotation,
  tilt,
  width = DEFAULT_WIDTH,
}: Props) {
  const height = width / LOGO_ASPECT
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
