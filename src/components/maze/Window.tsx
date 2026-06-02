import { Texture } from 'three'

const WINDOW_WIDTH = 0.85
const WINDOW_HEIGHT = 1.55

type Props = {
  texture: Texture
  position: [number, number, number]
  rotation: [number, number, number]
}

export default function Window({ texture, position, rotation }: Props) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[WINDOW_WIDTH, WINDOW_HEIGHT]} />
        <meshBasicMaterial
          map={texture}
          transparent
          alphaTest={0.03}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
