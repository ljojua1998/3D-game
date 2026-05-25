import { MazeGrid } from '../game/MazeGenerator'
import { Door } from '../game/doors'
import GeneratedMaze from './maze/GeneratedMaze'

type Props = {
  grid: MazeGrid
  doors: Door[]
}

export default function PromptMazeDirector({ grid, doors }: Props) {
  return <GeneratedMaze grid={grid} doors={doors} />
}
