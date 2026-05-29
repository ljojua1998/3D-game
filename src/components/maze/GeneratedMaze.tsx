import { Fragment } from 'react'
import { MazeGrid } from '../../game/MazeGenerator'
import { Door as DoorData } from '../../game/doors'
import { useLogoTexture } from './logoTexture'
import Wall, { CELL_SIZE } from './Wall'
import Door from './Door'
import EndMarker from './EndMarker'
import GroundLogos from './GroundLogos'

export const cellToWorld = (x: number, y: number): [number, number, number] => [
  x * CELL_SIZE,
  y * CELL_SIZE,
  0,
]

type Props = {
  grid: MazeGrid
  doors: DoorData[]
  nearbyDoorId: string | null
}

export default function GeneratedMaze({ grid, doors, nearbyDoorId }: Props) {
  const logo = useLogoTexture()

  const walls: JSX.Element[] = []
  let k = 0
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const cell = grid.cells[y][x]
      const wx = x * CELL_SIZE
      const wy = y * CELL_SIZE
      if (cell.walls.N)
        walls.push(
          <Wall
            key={`n-${k++}`}
            position={[wx, wy + CELL_SIZE / 2, 0]}
            orientation="horizontal"
            logo={logo}
          />,
        )
      if (cell.walls.E)
        walls.push(
          <Wall
            key={`e-${k++}`}
            position={[wx + CELL_SIZE / 2, wy, 0]}
            orientation="vertical"
            logo={logo}
          />,
        )
      if (y === 0 && cell.walls.S)
        walls.push(
          <Wall
            key={`s-${k++}`}
            position={[wx, wy - CELL_SIZE / 2, 0]}
            orientation="horizontal"
            logo={logo}
          />,
        )
      if (x === 0 && cell.walls.W)
        walls.push(
          <Wall
            key={`w-${k++}`}
            position={[wx - CELL_SIZE / 2, wy, 0]}
            orientation="vertical"
            logo={logo}
          />,
        )
    }
  }

  const endPos = cellToWorld(grid.end.x, grid.end.y)

  return (
    <Fragment>
      {walls}
      <GroundLogos grid={grid} texture={logo} />
      {doors.map(d => <Door key={d.id} door={d} isNearby={nearbyDoorId === d.id} />)}
      <EndMarker position={endPos} />
    </Fragment>
  )
}
