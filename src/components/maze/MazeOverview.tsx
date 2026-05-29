import { useEffect, useMemo, useReducer } from 'react'
import { MazeGrid } from '../../game/MazeGenerator'
import { shortestPath } from '../../game/pathfinding'
import { getTurns } from '../../game/pathAnalysis'
import { playerState } from '../../game/playerState'
import { Door } from '../../game/doors'
import { CELL_SIZE } from './Wall'

const PX = 14

type Props = {
  grid: MazeGrid
  doors: Door[]
  onRegenerate: () => void
}

export default function MazeOverview({ grid, doors, onRegenerate }: Props) {
  const [, tick] = useReducer((s: number) => s + 1, 0)

  useEffect(() => {
    let raf = 0
    const loop = () => {
      tick()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const path = useMemo(() => shortestPath(grid), [grid])
  const turns = useMemo(() => getTurns(path, grid), [path, grid])

  const w = grid.width * PX
  const h = grid.height * PX

  const playerSx = (playerState.x / CELL_SIZE + 0.5) * PX
  const playerSy = h - (playerState.y / CELL_SIZE + 0.5) * PX
  const rotDeg = -(90 + (playerState.yawZ * 180) / Math.PI)

  const cellX = Math.round(playerState.x / CELL_SIZE)
  const cellY = Math.round(playerState.y / CELL_SIZE)

  const walls: JSX.Element[] = []
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const c = grid.cells[y][x]
      const sx = x * PX
      const sy = h - (y + 1) * PX
      if (c.walls.N)
        walls.push(<line key={`n${x}-${y}`} x1={sx} y1={sy} x2={sx + PX} y2={sy} />)
      if (y === 0 && c.walls.S)
        walls.push(<line key={`s${x}-${y}`} x1={sx} y1={sy + PX} x2={sx + PX} y2={sy + PX} />)
      if (c.walls.E)
        walls.push(<line key={`e${x}-${y}`} x1={sx + PX} y1={sy} x2={sx + PX} y2={sy + PX} />)
      if (x === 0 && c.walls.W)
        walls.push(<line key={`w${x}-${y}`} x1={sx} y1={sy} x2={sx} y2={sy + PX} />)
    }
  }

  const pathPoints = path
    .map(c => `${(c.x + 0.5) * PX},${h - (c.y + 0.5) * PX}`)
    .join(' ')

  const startSx = (grid.start.x + 0.5) * PX
  const startSy = h - (grid.start.y + 0.5) * PX
  const endSx = (grid.end.x + 0.5) * PX
  const endSy = h - (grid.end.y + 0.5) * PX

  const margin = 14
  const svgW = w + margin * 2
  const svgH = h + margin * 2

  const doorLines = doors.map(d => {
    const dx = (d.position[0] / CELL_SIZE + 0.5) * PX
    const dy = h - (d.position[1] / CELL_SIZE + 0.5) * PX
    const half = PX * 0.42
    const cls = `maze-minimap__door--${d.status}`
    if (d.orientation === 'horizontal') {
      return (
        <line
          key={d.id}
          x1={dx - half}
          y1={dy}
          x2={dx + half}
          y2={dy}
          className={`maze-minimap__door ${cls}`}
        />
      )
    }
    return (
      <line
        key={d.id}
        x1={dx}
        y1={dy - half}
        x2={dx}
        y2={dy + half}
        className={`maze-minimap__door ${cls}`}
      />
    )
  })

  return (
    <div className="maze-minimap">
      <div className="maze-minimap__header">
        <span className="maze-minimap__badge">TEST MODE</span>
        <span className="maze-minimap__title">Maze Map</span>
      </div>
      <svg
        width={svgW}
        height={svgH}
        viewBox={`${-margin} ${-margin} ${svgW} ${svgH}`}
        className="maze-minimap__svg"
      >
        <text x={w / 2} y={-4} textAnchor="middle" className="maze-minimap__compass">N</text>
        <text x={w / 2} y={h + 10} textAnchor="middle" className="maze-minimap__compass">S</text>
        <text x={-4} y={h / 2 + 3} textAnchor="end" className="maze-minimap__compass">W</text>
        <text x={w + 4} y={h / 2 + 3} textAnchor="start" className="maze-minimap__compass">E</text>
        <polyline className="maze-minimap__path" points={pathPoints} />
        {turns.map((t, i) => (
          <circle
            key={`turn-${i}`}
            cx={(t.cell.x + 0.5) * PX}
            cy={h - (t.cell.y + 0.5) * PX}
            r={PX * 0.16}
            className="maze-minimap__turn"
          />
        ))}
        <g className="maze-minimap__walls">{walls}</g>
        {doorLines}
        <circle
          cx={startSx}
          cy={startSy}
          r={Math.max(3, PX * 0.28)}
          className="maze-minimap__start"
        />
        <polygon
          points={`${endSx},${endSy - PX * 0.4} ${endSx + PX * 0.36},${endSy + PX * 0.28} ${endSx - PX * 0.36},${endSy + PX * 0.28}`}
          className="maze-minimap__end"
        />
        <g transform={`translate(${playerSx} ${playerSy}) rotate(${rotDeg})`}>
          <polygon
            points={`${PX * 0.48},0 ${-PX * 0.26},${PX * 0.26} ${-PX * 0.26},${-PX * 0.26}`}
            className="maze-minimap__player"
          />
        </g>
      </svg>
      <div className="maze-minimap__info">
        <span>
          seed <b>{grid.seed}</b>
        </span>
        <span>
          cell ({cellX}, {cellY})
        </span>
        <span>
          doors <b>{doors.filter(d => d.status !== 'unlocked').length}</b>/{doors.length}
        </span>
      </div>
      <div className="maze-minimap__keys">
        <span>
          <kbd>M</kbd> hide
        </span>
        <span>
          <kbd>G</kbd> new maze
        </span>
        <span>
          <kbd>T</kbd> talk
        </span>
        <span>
          <kbd>⇧U</kbd> dev unlock
        </span>
      </div>
      <div className="maze-minimap__legend">
        <span>
          <span className="maze-minimap__swatch maze-minimap__swatch--start" /> start
        </span>
        <span>
          <span className="maze-minimap__swatch maze-minimap__swatch--end" /> end
        </span>
        <span>
          <span className="maze-minimap__swatch maze-minimap__swatch--player" /> you
        </span>
        <span>
          <span className="maze-minimap__swatch maze-minimap__swatch--door-locked" /> locked
        </span>
        <span>
          <span className="maze-minimap__swatch maze-minimap__swatch--door-unlocked" /> open
        </span>
      </div>
    </div>
  )
}
