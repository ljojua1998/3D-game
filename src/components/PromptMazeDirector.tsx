import { MazeGrid } from '../game/MazeGenerator'
import GeneratedMaze from './maze/GeneratedMaze'

export default function PromptMazeDirector({ grid }: { grid: MazeGrid }) {
  return <GeneratedMaze grid={grid} />
}
