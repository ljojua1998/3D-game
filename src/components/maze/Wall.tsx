import { useBox } from '@react-three/cannon'
import { Edges } from '@react-three/drei'
import { Fragment, useMemo } from 'react'
import { BoxGeometry, BufferAttribute, BufferGeometry, Color, Mesh, Texture } from 'three'
import { CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS } from '../../game/constants'
import { NEON_GREEN, WALL_BOTTOM_COLOR, WALL_TOP_COLOR } from '../../theme'
import { getWindowTexture } from './windowTexture'
import WallLogo from './WallLogo'
import Window from './Window'

export { CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS }

// Build a box whose vertices carry a vertical color gradient (bottom→top).
// The wall mesh isn't rotated, so the box's local Z is world height.
function buildGradientBox(args: [number, number, number]): BufferGeometry {
  const g = new BoxGeometry(args[0], args[1], args[2])
  const pos = g.attributes.position
  const top = new Color(WALL_TOP_COLOR)
  const bottom = new Color(WALL_BOTTOM_COLOR)
  const tmp = new Color()
  const colors = new Float32Array(pos.count * 3)
  const h = args[2]
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getZ(i) + h / 2) / h // 0 at base, 1 at top
    tmp.copy(bottom).lerp(top, t)
    colors[i * 3] = tmp.r
    colors[i * 3 + 1] = tmp.g
    colors[i * 3 + 2] = tmp.b
  }
  g.setAttribute('color', new BufferAttribute(colors, 3))
  return g
}

// Two wall shapes (horizontal / vertical) share one gradient geometry each.
const gradientGeomCache: Record<'horizontal' | 'vertical', BufferGeometry | null> = {
  horizontal: null,
  vertical: null,
}
function gradientGeom(orientation: 'horizontal' | 'vertical', args: [number, number, number]): BufferGeometry {
  if (!gradientGeomCache[orientation]) gradientGeomCache[orientation] = buildGradientBox(args)
  return gradientGeomCache[orientation]!
}

// Horizontal green "circuit band" loops wrapping the wall at a few heights —
// the green neon lines that run around every wall.
function buildBands(args: [number, number, number]): BufferGeometry {
  const hx = args[0] / 2
  const hy = args[1] / 2
  const h = args[2]
  const pts: number[] = []
  for (const frac of [0.32, 0.62, 0.86]) {
    const z = -h / 2 + frac * h
    const corners: [number, number][] = [
      [-hx, -hy], [hx, -hy], [hx, hy], [-hx, hy],
    ]
    for (let i = 0; i < 4; i++) {
      const a = corners[i]
      const b = corners[(i + 1) % 4]
      pts.push(a[0], a[1], z, b[0], b[1], z)
    }
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3))
  return g
}
const bandsGeomCache: Record<'horizontal' | 'vertical', BufferGeometry | null> = {
  horizontal: null,
  vertical: null,
}
function bandsGeom(orientation: 'horizontal' | 'vertical', args: [number, number, number]): BufferGeometry {
  if (!bandsGeomCache[orientation]) bandsGeomCache[orientation] = buildBands(args)
  return bandsGeomCache[orientation]!
}

const LOGO_OFFSET = 0.02
const WINDOW_OFFSET = 0.025
const WINDOW_CHANCE = 0.22

type WallProps = {
  position: [number, number, number]
  orientation: 'horizontal' | 'vertical'
  wallpapers?: Texture[]
}

const ART_WIDTH = 1.4

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

export default function Wall({ position, orientation, wallpapers = [] }: WallProps) {
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
      <mesh ref={ref} geometry={gradientGeom(orientation, args)} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.6} metalness={0.05} />
        {/* Green neon edge outline + horizontal circuit bands on every wall. */}
        <Edges threshold={15} color={NEON_GREEN} />
        <lineSegments geometry={bandsGeom(orientation, args)}>
          <lineBasicMaterial color={NEON_GREEN} toneMapped={false} transparent opacity={0.9} />
        </lineSegments>
      </mesh>
      {faceConfigs.map((cfg, i) => {
        const facePos: [number, number, number] = [cfg.surfaceX, cfg.surfaceY, faceZ]
        const windowPos: [number, number, number] = [
          orientation === 'horizontal' ? cfg.surfaceX : cfg.surfaceX + Math.sign(cfg.surfaceX - position[0]) * (WINDOW_OFFSET - LOGO_OFFSET),
          orientation === 'vertical' ? cfg.surfaceY : cfg.surfaceY + Math.sign(cfg.surfaceY - position[1]) * (WINDOW_OFFSET - LOGO_OFFSET),
          windowZ,
        ]
        const logoBelowPos: [number, number, number] = [cfg.surfaceX, cfg.surfaceY, logoBelowZ]
        // Deterministically pick one tinted wall-art per face so the layout is
        // stable across re-renders (and matches the persisted maze seed feel).
        const art = wallpapers.length
          ? wallpapers[Math.floor(hashUnit(position[0], position[1], position[2], 10 + i) * wallpapers.length) % wallpapers.length]
          : null
        return (
          <Fragment key={i}>
            {hasWindow && windowTex && (
              <Window texture={windowTex} position={windowPos} rotation={cfg.rotation} />
            )}
            {art && hasWindow && (
              <WallLogo
                texture={art}
                position={logoBelowPos}
                rotation={cfg.rotation}
                tilt={0}
                width={ART_WIDTH * 0.7}
                aspect={1}
              />
            )}
            {art && !hasWindow && (
              <WallLogo
                texture={art}
                position={facePos}
                rotation={cfg.rotation}
                tilt={cfg.randomTilt}
                width={ART_WIDTH}
                aspect={1}
              />
            )}
          </Fragment>
        )
      })}
    </>
  )
}
