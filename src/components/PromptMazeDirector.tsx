import { MazeGrid } from '../game/MazeGenerator'
import { Door } from '../game/doors'
import GeneratedMaze from './maze/GeneratedMaze'

type Props = {
  grid: MazeGrid
  doors: Door[]
  nearbyDoorId: string | null
}

export default function PromptMazeDirector({ grid, doors, nearbyDoorId }: Props) {
  return <GeneratedMaze grid={grid} doors={doors} nearbyDoorId={nearbyDoorId} />
}
