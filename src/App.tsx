import { Physics } from '@react-three/cannon'
import { Stars } from '@react-three/drei'
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import PromptMazeDirector from './components/PromptMazeDirector'
import FPSControls from './components/three/FPSControls'
import GroundPlane from './components/three/GroundPlane'
import Skydome from './components/three/Skydome'
import MazeOverview from './components/maze/MazeOverview'
import PasscodeHUD from './components/ui/PasscodeHUD'
import ProximityPrompt from './components/ui/ProximityPrompt'
import ScenarioDialog from './components/ui/ScenarioDialog'
import PasscodeDialog from './components/ui/PasscodeDialog'
import RunStatsHUD, { RUN_DURATION_MS } from './components/ui/RunStatsHUD'
import WinScreen from './components/ui/WinScreen'
import LoseScreen from './components/ui/LoseScreen'
import { generateMaze, MazeGrid } from './game/MazeGenerator'
import { shortestPath } from './game/pathfinding'
import { getTurns } from './game/pathAnalysis'
import { Door, checkAnswer, placeDoors } from './game/doors'
import { ExitGate, computeExitGate, validatePasscode } from './game/exitGate'
import { Scenario, SCENARIOS } from './game/scenarios'
import { syncGameState } from './game/gameState'
import { playerState } from './game/playerState'
import { mulberry32 } from './game/rng'
import { MAZE_HEIGHT, MAZE_SEED, MAZE_WIDTH } from './config'
import { FOG_COLOR } from './theme'

const DOOR_COUNT = 4
const MIN_TURNS = 3
const PROXIMITY_RADIUS = 2.0
const GATE_PROXIMITY_RADIUS = 2.2
const MAX_ATTEMPTS = 3
const COOLDOWN_MS = 5000

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
  gate: ExitGate
}

function freshWorld(): WorldState {
  const grid = generateValidMaze()
  return { grid, doors: computeDoors(grid), gate: computeExitGate(grid) }
}

const SCENARIO_BY_ID = new Map(SCENARIOS.map(s => [s.id, s]))

export default function App() {
  const contactMaterial = {
    contactEquationStiffness: 1e4,
    friction: 0.001,
  }

  const [world, setWorld] = useState<WorldState>(freshWorld)
  const [minimapVisible, setMinimapVisible] = useState(false)
  const [collectedLetters, setCollectedLetters] = useState<string[]>([])
  const [nearbyDoorId, setNearbyDoorId] = useState<string | null>(null)
  const [nearbyGate, setNearbyGate] = useState(false)
  const [openDialogDoorId, setOpenDialogDoorId] = useState<string | null>(null)
  const [passcodeOpen, setPasscodeOpen] = useState(false)
  const [won, setWon] = useState(false)
  const [lost, setLost] = useState(false)
  const [runStartedAt, setRunStartedAt] = useState(() => Date.now())
  const [runEndedAt, setRunEndedAt] = useState<number | null>(null)
  const [promptCount, setPromptCount] = useState(0)
  const wrongAttemptsRef = useRef<Map<string, number>>(new Map())

  const hasAllLetters =
    world.doors.length > 0 && collectedLetters.length === world.doors.length

  const regenerate = useCallback(() => {
    setWorld(freshWorld())
    setCollectedLetters([])
    setOpenDialogDoorId(null)
    setNearbyDoorId(null)
    setNearbyGate(false)
    setPasscodeOpen(false)
    setWon(false)
    setLost(false)
    setRunStartedAt(Date.now())
    setRunEndedAt(null)
    setPromptCount(0)
    wrongAttemptsRef.current = new Map()
  }, [])

  const devUnlockAll = useCallback(() => {
    setWorld(w => ({
      ...w,
      doors: w.doors.map(d => ({ ...d, status: 'unlocked', cooldownUntil: 0 })),
    }))
    setCollectedLetters(world.doors.map(d => d.letter))
  }, [world.doors])

  useEffect(() => {
    syncGameState({ doors: world.doors, collectedLetters, won })
  }, [world.doors, collectedLetters, won])

  useEffect(() => {
    if (won || lost) return
    const id = setInterval(() => {
      if (Date.now() >= runStartedAt + RUN_DURATION_MS) {
        setLost(true)
        setOpenDialogDoorId(null)
        setPasscodeOpen(false)
        if (document.pointerLockElement === document.body) document.exitPointerLock()
      }
    }, 250)
    return () => clearInterval(id)
  }, [won, lost, runStartedAt])

  useEffect(() => {
    const path = shortestPath(world.grid)
    const turns = getTurns(path, world.grid)
    console.log(
      `[maze] seed=${world.grid.seed} size=${world.grid.width}x${world.grid.height} path_len=${path.length} decisive_turns=${turns.length} doors=${world.doors.length} letters=[${world.doors.map(d => d.letter).join(',')}]`,
    )
  }, [world])

  // Proximity loop + cooldown auto-expire
  useEffect(() => {
    let raf = 0
    const loop = () => {
      const now = Date.now()

      const hasExpired = world.doors.some(
        d => d.status === 'cooldown' && d.cooldownUntil <= now,
      )
      if (hasExpired) {
        setWorld(w => ({
          ...w,
          doors: w.doors.map(d => {
            if (d.status === 'cooldown' && d.cooldownUntil <= now) {
              wrongAttemptsRef.current.delete(d.id)
              return { ...d, status: 'locked', cooldownUntil: 0 }
            }
            return d
          }),
        }))
      }

      let closest: string | null = null
      let minDist = PROXIMITY_RADIUS
      for (const d of world.doors) {
        if (d.status === 'unlocked') continue
        const dx = playerState.x - d.position[0]
        const dy = playerState.y - d.position[1]
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < minDist) {
          closest = d.id
          minDist = dist
        }
      }
      setNearbyDoorId(prev => (prev === closest ? prev : closest))

      const gdx = playerState.x - world.gate.position[0]
      const gdy = playerState.y - world.gate.position[1]
      const gateDist = Math.sqrt(gdx * gdx + gdy * gdy)
      const near = !world.gate.unlocked && gateDist < GATE_PROXIMITY_RADIUS
      setNearbyGate(prev => (prev === near ? prev : near))

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [world.doors, world.gate])

  useEffect(() => {
    const isInputTarget = (t: EventTarget | null) =>
      t instanceof HTMLTextAreaElement || t instanceof HTMLInputElement

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (openDialogDoorId) {
          e.preventDefault()
          setOpenDialogDoorId(null)
          return
        }
        if (passcodeOpen) {
          e.preventDefault()
          setPasscodeOpen(false)
          return
        }
      }
      if (isInputTarget(e.target)) return
      if (won || lost) return

      if (e.code === 'KeyM') {
        setMinimapVisible(v => !v)
      } else if (e.code === 'KeyG') {
        regenerate()
      } else if (e.code === 'KeyU' && e.shiftKey) {
        devUnlockAll()
      } else if (e.code === 'KeyT') {
        if (openDialogDoorId || passcodeOpen || !nearbyDoorId) return
        const d = world.doors.find(x => x.id === nearbyDoorId)
        if (!d || d.status !== 'locked') return
        e.preventDefault()
        if (document.pointerLockElement === document.body) document.exitPointerLock()
        setOpenDialogDoorId(nearbyDoorId)
      } else if (e.code === 'KeyU' && !e.shiftKey) {
        if (passcodeOpen) return
        const targetDoorId = openDialogDoorId ?? nearbyDoorId
        if (!targetDoorId) return
        const d = world.doors.find(x => x.id === targetDoorId)
        if (!d || d.status !== 'answered') return
        e.preventDefault()
        setWorld(w => ({
          ...w,
          doors: w.doors.map(x =>
            x.id === d.id ? { ...x, status: 'unlocked', cooldownUntil: 0 } : x,
          ),
        }))
        setCollectedLetters(prev => [...prev, d.letter])
        if (openDialogDoorId) setOpenDialogDoorId(null)
      } else if (e.code === 'KeyE') {
        if (openDialogDoorId || passcodeOpen) return
        if (!nearbyGate || !hasAllLetters || world.gate.unlocked) return
        e.preventDefault()
        if (document.pointerLockElement === document.body) document.exitPointerLock()
        setPasscodeOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [
    regenerate,
    devUnlockAll,
    nearbyDoorId,
    openDialogDoorId,
    passcodeOpen,
    nearbyGate,
    hasAllLetters,
    world.doors,
    world.gate.unlocked,
    won,
    lost,
  ])

  const openDoor = openDialogDoorId
    ? world.doors.find(d => d.id === openDialogDoorId) ?? null
    : null
  const openScenario: Scenario | null = openDoor
    ? SCENARIO_BY_ID.get(openDoor.scenarioId) ?? null
    : null
  const attemptsLeft = useMemo(() => {
    if (!openDoor) return MAX_ATTEMPTS
    return MAX_ATTEMPTS - (wrongAttemptsRef.current.get(openDoor.id) ?? 0)
  }, [openDoor])

  const handleSubmit = useCallback(
    (answer: string): 'correct' | 'wrong' | 'cooldown' => {
      if (!openDoor || !openScenario) return 'wrong'
      setPromptCount(p => p + 1)
      const correct = checkAnswer(answer, openScenario.accept)
      if (correct) {
        setWorld(w => ({
          ...w,
          doors: w.doors.map(d =>
            d.id === openDoor.id ? { ...d, status: 'answered' } : d,
          ),
        }))
        wrongAttemptsRef.current.delete(openDoor.id)
        return 'correct'
      }
      const cur = wrongAttemptsRef.current.get(openDoor.id) ?? 0
      const newCount = cur + 1
      if (newCount >= MAX_ATTEMPTS) {
        wrongAttemptsRef.current.delete(openDoor.id)
        setWorld(w => ({
          ...w,
          doors: w.doors.map(d =>
            d.id === openDoor.id
              ? { ...d, status: 'cooldown', cooldownUntil: Date.now() + COOLDOWN_MS }
              : d,
          ),
        }))
        return 'cooldown'
      }
      wrongAttemptsRef.current.set(openDoor.id, newCount)
      return 'wrong'
    },
    [openDoor, openScenario],
  )

  const closeDialog = useCallback(() => setOpenDialogDoorId(null), [])

  const handlePasscodeSubmit = useCallback(
    (input: string): boolean => {
      setPromptCount(p => p + 1)
      const ok = validatePasscode(input, collectedLetters)
      if (!ok) return false
      setWorld(w => ({ ...w, gate: { ...w.gate, unlocked: true } }))
      setPasscodeOpen(false)
      setWon(true)
      setRunEndedAt(Date.now())
      return true
    },
    [collectedLetters],
  )

  const closePasscode = useCallback(() => setPasscodeOpen(false), [])

  const nearbyDoor = nearbyDoorId
    ? world.doors.find(d => d.id === nearbyDoorId) ?? null
    : null
  const promptStatus = nearbyDoor && !openDialogDoorId && !passcodeOpen
    ? nearbyDoor.status === 'locked' ||
      nearbyDoor.status === 'answered' ||
      nearbyDoor.status === 'cooldown'
      ? nearbyDoor.status
      : null
    : null

  const gatePromptKind: 'ready' | 'locked' | null =
    nearbyGate && !passcodeOpen && !openDialogDoorId
      ? hasAllLetters
        ? 'ready'
        : 'locked'
      : null

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
          <PhysicsWorld
            grid={world.grid}
            doors={world.doors}
            gate={world.gate}
            nearbyDoorId={nearbyDoorId}
            nearbyGate={nearbyGate}
            hasAllLetters={hasAllLetters}
          />
        </Physics>
      </Canvas>
      <PasscodeHUD totalSlots={world.doors.length} collected={collectedLetters} />
      <RunStatsHUD
        startedAt={runStartedAt}
        endedAt={runEndedAt}
        promptCount={promptCount}
        lost={lost}
      />
      <ProximityPrompt
        status={promptStatus}
        cooldownUntil={nearbyDoor?.cooldownUntil}
        letter={nearbyDoor?.letter}
        gateKind={gatePromptKind}
      />
      {minimapVisible && (
        <MazeOverview grid={world.grid} doors={world.doors} onRegenerate={regenerate} />
      )}
      {openDoor && openScenario && (
        <ScenarioDialog
          door={openDoor}
          scenario={openScenario}
          attemptsLeft={attemptsLeft}
          onSubmit={handleSubmit}
          onClose={closeDialog}
        />
      )}
      {passcodeOpen && (
        <PasscodeDialog
          collected={collectedLetters}
          onSubmit={handlePasscodeSubmit}
          onClose={closePasscode}
        />
      )}
      {won && runEndedAt !== null && (
        <WinScreen
          passcode={collectedLetters.join(' ')}
          doorsUnlocked={world.doors.filter(d => d.status === 'unlocked').length}
          elapsedMs={runEndedAt - runStartedAt}
          promptCount={promptCount}
          onRestart={regenerate}
        />
      )}
      {lost && (
        <LoseScreen
          collectedCount={collectedLetters.length}
          totalDoors={world.doors.length}
          promptCount={promptCount}
          onRestart={regenerate}
        />
      )}
    </>
  )
}

export function PhysicsWorld({
  grid,
  doors,
  gate,
  nearbyDoorId,
  nearbyGate,
  hasAllLetters,
}: {
  grid: MazeGrid
  doors: Door[]
  gate: ExitGate
  nearbyDoorId: string | null
  nearbyGate: boolean
  hasAllLetters: boolean
}) {
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
      <PromptMazeDirector
        grid={grid}
        doors={doors}
        gate={gate}
        nearbyDoorId={nearbyDoorId}
        nearbyGate={nearbyGate}
        hasAllLetters={hasAllLetters}
      />
    </Suspense>
  )
}
