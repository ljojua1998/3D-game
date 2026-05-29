import { MazeGrid } from '../game/MazeGenerator'
import { Door } from '../game/doors'
import GeneratedMaze from './maze/GeneratedMaze'

type Props = {
  grid: MazeGrid
  doors: Door[]
  nearbyDoorId: string | null
}

export default function PromptMazeDirector(props: Props) {
  return <GeneratedMaze {...props} />
}
