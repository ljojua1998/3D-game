import { MazeGrid } from '../game/MazeGenerator'
import { Door } from '../game/doors'
import { ExitGate } from '../game/exitGate'
import GeneratedMaze from './maze/GeneratedMaze'

type Props = {
  grid: MazeGrid
  doors: Door[]
  gate: ExitGate
  nearbyDoorId: string | null
  nearbyGate: boolean
  hasAllLetters: boolean
}

export default function PromptMazeDirector(props: Props) {
  return <GeneratedMaze {...props} />
}
