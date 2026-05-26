import { useBox } from '@react-three/cannon'
import { Fragment, useMemo } from 'react'
import { Mesh, Texture } from 'three'
import { CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS } from '../../game/constants'
import { getStoneTexture } from './wallTexture'
import { getWindowTexture } from './windowTexture'
import WallLogo from './WallLogo'
import Window from './Window'

export { CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS }

const LOGO_OFFSET = 0.02
const WINDOW_OFFSET = 0.025
const WINDOW_CHANCE = 0.22
const HORIZONTAL_LOGO_WIDTH = 1.3

type WallProps = {
  position: [number, number, number]
  orientation: 'horizontal' | 'vertical'
  tint?: string
  logo?: Texture | null
}

function hashUnit(x: number, y: number, z: number, salt: number): number {
  let h = Math.imul(Math.round(x * 100) | 0, 73856093)
  h ^= Math.imul(Math.round(y * 100) | 0, 19349663)
  h ^= Math.imul(Math.round(z * 100) | 0, 83492791)
  h ^= salt * 2654435761
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  h ^= h >>> 16
  return (h >>> 0) / 0xffffffff
}

type FaceCfg = {
  surfaceX: number
  surfaceY: number
  rotation: [number, number, number]
  randomTilt: number
}

export default function Wall({ position, orientation, tint = '#ffffff', logo }: WallProps) {
  const args: [number, number, number] =
    orientation === 'horizontal'
      ? [CELL_SIZE, WALL_THICKNESS, WALL_HEIGHT]
      : [WALL_THICKNESS, CELL_SIZE, WALL_HEIGHT]
  const center: [number, number, number] = [position[0], position[1], position[2] + WALL_HEIGHT / 2]
  const [ref] = useBox<Mesh>(() => ({
    type: 'Static',
    args,
    position: center,
  }))

  const texture = useMemo(() => {
    const t = getStoneTexture().clone()
    t.repeat.set(CELL_SIZE / 2, WALL_HEIGHT / 2)
    t.needsUpdate = true
    return t
  }, [])

  const hasWindow = useMemo(
    () => hashUnit(position[0], position[1], position[2], 0) < WINDOW_CHANCE,
    [position],
  )
  const windowTex = useMemo(() => (hasWindow ? getWindowTexture() : null), [hasWindow])

  const halfT = WALL_THICKNESS / 2
  const baseZ = position[2]
  const faceZ = baseZ + WALL_HEIGHT / 2
  const windowZ = baseZ + 1.2
  const logoBelowZ = baseZ + 0.28

  const faceConfigs: FaceCfg[] = useMemo(() => {
    if (orientation === 'horizontal') {
      return [
        {
          surfaceX: position[0],
          surfaceY: position[1] + halfT + LOGO_OFFSET,
          rotation: [Math.PI / 2, Math.PI, 0],
          randomTilt: hashUnit(position[0], position[1], position[2], 1) * Math.PI * 2,
        },
        {
          surfaceX: position[0],
          surfaceY: position[1] - halfT - LOGO_OFFSET,
          rotation: [Math.PI / 2, 0, 0],
          randomTilt: hashUnit(position[0], position[1], position[2], 2) * Math.PI * 2,
        },
      ]
    }
    return [
      {
        surfaceX: position[0] + halfT + LOGO_OFFSET,
        surfaceY: position[1],
        rotation: [Math.PI / 2, Math.PI / 2, 0],
        randomTilt: hashUnit(position[0], position[1], position[2], 1) * Math.PI * 2,
      },
      {
        surfaceX: position[0] - halfT - LOGO_OFFSET,
        surfaceY: position[1],
        rotation: [Math.PI / 2, -Math.PI / 2, 0],
        randomTilt: hashUnit(position[0], position[1], position[2], 2) * Math.PI * 2,
      },
    ]
  }, [orientation, position, halfT])

  return (
    <>
      <mesh ref={ref} castShadow receiveShadow>
        <boxGeometry args={args} />
        <meshStandardMaterial map={texture} color={tint} roughness={0.86} metalness={0.04} />
      </mesh>
      {faceConfigs.map((cfg, i) => {
        const facePos: [number, number, number] = [cfg.surfaceX, cfg.surfaceY, faceZ]
        const windowPos: [number, number, number] = [
          orientation === 'horizontal' ? cfg.surfaceX : cfg.surfaceX + Math.sign(cfg.surfaceX - position[0]) * (WINDOW_OFFSET - LOGO_OFFSET),
          orientation === 'vertical' ? cfg.surfaceY : cfg.surfaceY + Math.sign(cfg.surfaceY - position[1]) * (WINDOW_OFFSET - LOGO_OFFSET),
          windowZ,
        ]
        const logoBelowPos: [number, number, number] = [cfg.surfaceX, cfg.surfaceY, logoBelowZ]
        return (
          <Fragment key={i}>
            {hasWindow && windowTex && (
              <Window texture={windowTex} position={windowPos} rotation={cfg.rotation} />
            )}
            {logo && hasWindow && (
              <WallLogo
                texture={logo}
                position={logoBelowPos}
                rotation={cfg.rotation}
                tilt={0}
                width={HORIZONTAL_LOGO_WIDTH}
              />
            )}
            {logo && !hasWindow && (
              <WallLogo
                texture={logo}
                position={facePos}
                rotation={cfg.rotation}
                tilt={cfg.randomTilt}
              />
            )}
          </Fragment>
        )
      })}
    </>
  )
}
