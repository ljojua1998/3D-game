import { useEffect, useReducer } from 'react'
import { MazeGrid } from '../../game/MazeGenerator'
import { playerState } from '../../game/playerState'
import { CELL_SIZE } from './Wall'

const PX = 14

type Props = {
  grid: MazeGrid
  onRegenerate: () => void
}

export default function MazeOverview({ grid, onRegenerate }: Props) {
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

  const startSx = (grid.start.x + 0.5) * PX
  const startSy = h - (grid.start.y + 0.5) * PX
  const endSx = (grid.end.x + 0.5) * PX
  const endSy = h - (grid.end.y + 0.5) * PX

  const margin = 14
  const svgW = w + margin * 2
  const svgH = h + margin * 2

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
        <g className="maze-minimap__walls">{walls}</g>
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
      </div>
      <div className="maze-minimap__keys">
        <span>
          <kbd>M</kbd> hide
        </span>
        <span>
          <kbd>G</kbd> new maze
        </span>
        <span>
          <kbd>WASD</kbd> move
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
      </div>
    </div>
  )
}
