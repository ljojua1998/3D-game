import { useState } from 'react'
import { generateMaze } from '../game/MazeGenerator'
import { MAZE_HEIGHT, MAZE_SEED, MAZE_WIDTH } from '../config'
import GeneratedMaze from './maze/GeneratedMaze'

export default function PromptMazeDirector() {
  const [grid] = useState(() => generateMaze(MAZE_WIDTH, MAZE_HEIGHT, MAZE_SEED))
  return <GeneratedMaze grid={grid} />
}
