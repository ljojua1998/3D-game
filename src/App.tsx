import { Physics } from '@react-three/cannon'
import { Stars } from '@react-three/drei'
import React, { Suspense, useCallback, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import PromptMazeDirector from './components/PromptMazeDirector'
import FPSControls from './components/three/FPSControls'
import GroundPlane from './components/three/GroundPlane'
import Skydome from './components/three/Skydome'
import MazeOverview from './components/maze/MazeOverview'
import { generateMaze, MazeGrid } from './game/MazeGenerator'
import { shortestPath } from './game/pathfinding'
import { getTurns } from './game/pathAnalysis'
import { Door, DoorState, placeDoors } from './game/doors'
import { syncGameState } from './game/gameState'
import { mulberry32 } from './game/rng'
import { MAZE_HEIGHT, MAZE_SEED, MAZE_WIDTH } from './config'
import { FOG_COLOR } from './theme'

const DOOR_COUNT = 4
const MIN_TURNS = 3

function generateValidMaze(): MazeGrid {
  let g = generateMaze(MAZE_WIDTH, MAZE_HEIGHT, MAZE_SEED)
  if (MAZE_SEED !== null) return g
  for (let i = 0; i < 50; i++) {
    const turns = getTurns(shortestPath(g), g)
    if (turns.length >= MIN_TURNS) return g
    g = generateMaze(MAZE_WIDTH, MAZE_HEIGHT, null)
  }
  return g
}

function computeDoors(grid: MazeGrid): Door[] {
  const path = shortestPath(grid)
  const turns = getTurns(path, grid)
  const rng = mulberry32(grid.seed)
  return placeDoors(turns, DOOR_COUNT, rng)
}

type WorldState = {
  grid: MazeGrid
  doors: Door[]
}

function freshWorld(): WorldState {
  const grid = generateValidMaze()
  return { grid, doors: computeDoors(grid) }
}

export default function App() {
  const contactMaterial = {
    contactEquationStiffness: 1e4,
    friction: 0.001,
  }

  const [world, setWorld] = useState<WorldState>(freshWorld)
  const [minimapVisible, setMinimapVisible] = useState(false)

  const regenerate = useCallback(() => {
    setWorld(freshWorld())
  }, [])

  const toggleAllDoors = useCallback(() => {
    setWorld(w => {
      const allUnlocked = w.doors.every(d => d.state === 'unlocked')
      const target: DoorState = allUnlocked ? 'locked' : 'unlocked'
      return { ...w, doors: w.doors.map(d => ({ ...d, state: target })) }
    })
  }, [])

  useEffect(() => {
    syncGameState({ doors: world.doors })
  }, [world.doors])

  useEffect(() => {
    const path = shortestPath(world.grid)
    const turns = getTurns(path, world.grid)
    console.log(
      `[maze] seed=${world.grid.seed} size=${world.grid.width}x${world.grid.height} path_len=${path.length} decisive_turns=${turns.length} doors=${world.doors.length}`,
    )
  }, [world])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') setMinimapVisible(v => !v)
      else if (e.code === 'KeyG') regenerate()
      else if (e.code === 'KeyU') toggleAllDoors()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [regenerate, toggleAllDoors])

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 0, 15], near: 0.1, far: 100000 }}
        onCreated={({ camera }) => {
          camera.up.set(0, 0, 1)
          camera.rotation.order = 'YZX'
        }}
      >
        <fog attach="fog" args={[FOG_COLOR, 1, 40]} />
        <ambientLight intensity={0.25} />
        <directionalLight intensity={0.25} position={[2000, 2000, 1000]} castShadow />
        <Skydome />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
        <Physics gravity={[0, 0, -25]} defaultContactMaterial={contactMaterial}>
          <PhysicsWorld grid={world.grid} doors={world.doors} />
        </Physics>
      </Canvas>
      {minimapVisible && (
        <MazeOverview grid={world.grid} doors={world.doors} onRegenerate={regenerate} />
      )}
    </>
  )
}

export function PhysicsWorld({ grid, doors }: { grid: MazeGrid; doors: Door[] }) {
  const setPaused = (paused: boolean) => {
    if (paused) document.getElementById('pause')!.classList.add('visible')
    else document.getElementById('pause')!.classList.remove('visible')
  }
  setPaused(document.pointerLockElement !== document.body)

  const spawn: [number, number, number] = [0, 0, 1]
  return (
    <Suspense fallback={null}>
      <GroundPlane />
      <FPSControls position={spawn} rotation={[Math.PI / 2, 0, 0]} setPaused={setPaused} />
      <PromptMazeDirector grid={grid} doors={doors} />
    </Suspense>
  )
}
