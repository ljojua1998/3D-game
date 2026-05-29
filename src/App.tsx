import { Physics } from '@react-three/cannon'
import { Stars } from '@react-three/drei'
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import PromptMazeDirector from './components/PromptMazeDirector'
import FPSControls from './components/three/FPSControls'
import GroundPlane from './components/three/GroundPlane'
import Skydome from './components/three/Skydome'
import MazeOverview from './components/maze/MazeOverview'
import ProximityPrompt from './components/ui/ProximityPrompt'
import ChatDialog from './components/ui/ChatDialog'
import RunStatsHUD, { DEFAULT_RUN_DURATION_MS } from './components/ui/RunStatsHUD'
import WinScreen from './components/ui/WinScreen'
import LoseScreen from './components/ui/LoseScreen'
import { generateMaze, MazeGrid } from './game/MazeGenerator'
import { shortestPath } from './game/pathfinding'
import { getTurns } from './game/pathAnalysis'
import { Door, placeDoors } from './game/doors'
import { syncGameState } from './game/gameState'
import { playerState } from './game/playerState'
import { mulberry32 } from './game/rng'
import { finishRun, startRun } from './ai/chatClient'
import { emitToParent } from './ai/postMessage'
import {
  ChatLanguage,
  DoorSpec,
  FinishRunResponse,
  InventoryItem,
  StartRunResponse,
} from './game/puzzles'
import { CELL_SIZE } from './game/constants'
import { MAZE_HEIGHT, MAZE_SEED, MAZE_WIDTH } from './config'
import { FOG_COLOR } from './theme'

const MIN_TURNS = 3
const PROXIMITY_RADIUS = 2.0
const END_RADIUS = 1.2

function generateValidMaze(width: number, height: number, seedOverride?: number | null): MazeGrid {
  // If the backend gave us a persisted seed (resume path), use it directly so
  // the maze layout matches the run that's already in progress.
  const effectiveSeed = seedOverride != null ? seedOverride : MAZE_SEED
  let g = generateMaze(width, height, effectiveSeed)
  if (effectiveSeed !== null) return g
  for (let i = 0; i < 50; i++) {
    const turns = getTurns(shortestPath(g), g)
    if (turns.length >= MIN_TURNS) return g
    g = generateMaze(width, height, null)
  }
  return g
}

function computeDoors(grid: MazeGrid, doorSpecs: DoorSpec[]): Door[] {
  const path = shortestPath(grid)
  const turns = getTurns(path, grid)
  const rng = mulberry32(grid.seed)
  return placeDoors(turns, doorSpecs, rng)
}

type WorldState = {
  grid: MazeGrid | null
  doors: Door[]
}

export default function App() {
  const contactMaterial = {
    contactEquationStiffness: 1e4,
    friction: 0.001,
  }

  const [world, setWorld] = useState<WorldState>({ grid: null, doors: [] })
  const [session, setSession] = useState<StartRunResponse | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [language, setLanguage] = useState<ChatLanguage>('ka')
  const [minimapVisible, setMinimapVisible] = useState(false)
  const [nearbyDoorId, setNearbyDoorId] = useState<string | null>(null)
  const [openDialogDoorId, setOpenDialogDoorId] = useState<string | null>(null)
  const [won, setWon] = useState(false)
  const [lost, setLost] = useState(false)
  const [runStartedAt, setRunStartedAt] = useState(() => Date.now())
  const [runEndedAt, setRunEndedAt] = useState<number | null>(null)
  const [promptCount, setPromptCount] = useState(0)
  const [finishResult, setFinishResult] = useState<FinishRunResponse | null>(null)
  const sessionRequestRef = useRef(0)
  const finishGuardRef = useRef(false)
  const readyEmittedRef = useRef(false)

  // Resolve maze / duration / language from backend response, with safe fallbacks
  const mazeWidth = session?.maze?.width ?? MAZE_WIDTH
  const mazeHeight = session?.maze?.height ?? MAZE_HEIGHT
  const runDurationMs = session?.runDurationMs ?? DEFAULT_RUN_DURATION_MS

  const loadSession = useCallback(() => {
    const reqId = ++sessionRequestRef.current
    setSession(null)
    setSessionError(null)
    setFinishResult(null)
    finishGuardRef.current = false
    startRun()
      .then(s => {
        if (sessionRequestRef.current !== reqId) return
        setSession(s)
        if (s.defaultLanguage) setLanguage(s.defaultLanguage)
        const grid = generateValidMaze(
          s.maze?.width ?? MAZE_WIDTH,
          s.maze?.height ?? MAZE_HEIGHT,
          s.mazeSeed ?? null,
        )
        // Apply any per-door unlock flags from a resumed session.
        const placed = computeDoors(grid, s.doors)
        const unlockedFromServer = new Map(
          s.doors.map(d => [d.id, Boolean(d.unlocked)] as const),
        )
        const doors = placed.map(d =>
          unlockedFromServer.get(d.id)
            ? { ...d, status: 'unlocked' as const }
            : d,
        )
        setWorld({ grid, doors })
        // Resume: anchor startedAt so the HUD ticks down from the correct
        // remaining time.
        const elapsedMs = s.resumed && typeof s.elapsedMs === 'number' ? s.elapsedMs : 0
        setRunStartedAt(Date.now() - elapsedMs)
        emitToParent({ type: 'promptmaze:run-started', sessionId: s.sessionId })
      })
      .catch(err => {
        if (sessionRequestRef.current !== reqId) return
        setSessionError(String(err))
      })
  }, [])

  useEffect(() => {
    if (!readyEmittedRef.current) {
      readyEmittedRef.current = true
      emitToParent({ type: 'promptmaze:ready' })
    }
    loadSession()
  }, [loadSession])

  const regenerate = useCallback(() => {
    setWorld({ grid: null, doors: [] })
    setOpenDialogDoorId(null)
    setNearbyDoorId(null)
    setWon(false)
    setLost(false)
    setRunEndedAt(null)
    setPromptCount(0)
    loadSession()
  }, [loadSession])

  // Win/Lose popup "restart" should hand control back to the embedding host so
  // a new player can register, not silently start a same-user replay.
  const requestRestartFromHost = useCallback(() => {
    emitToParent({ type: 'promptmaze:user-requested-restart' })
  }, [])

  const devUnlockAll = useCallback(() => {
    setWorld(w => ({
      ...w,
      doors: w.doors.map(d => ({ ...d, status: 'unlocked' })),
    }))
  }, [])

  useEffect(() => {
    syncGameState({ doors: world.doors, won })
  }, [world.doors, won])

  // Reports the run as finished to the backend + the embedding host.
  // Guards against double-fire (both win-trigger and time-expiry can race).
  const reportFinish = useCallback(
    async (completed: boolean, endedAt: number) => {
      if (finishGuardRef.current) return
      if (!session) return
      finishGuardRef.current = true

      const elapsedMs = endedAt - runStartedAt
      let result: FinishRunResponse | null = null
      try {
        result = await finishRun({
          sessionId: session.sessionId,
          elapsedMs,
          promptCount,
          completed,
        })
      } catch (err) {
        // Backend unreachable / network error — log but still emit postMessage
        // eslint-disable-next-line no-console
        console.warn('[promptmaze] finishRun failed:', err)
      }
      setFinishResult(result)
      emitToParent({
        type: 'promptmaze:run-finished',
        sessionId: session.sessionId,
        elapsedMs,
        promptCount,
        completed,
        rank: result?.rank ?? null,
        totalCompleted: result?.totalCompleted ?? 0,
      })
    },
    [session, runStartedAt, promptCount],
  )

  useEffect(() => {
    if (won || lost) return
    if (!world.grid) return
    const id = setInterval(() => {
      if (Date.now() >= runStartedAt + runDurationMs) {
        const endedAt = runStartedAt + runDurationMs
        setLost(true)
        setRunEndedAt(endedAt)
        setOpenDialogDoorId(null)
        if (document.pointerLockElement === document.body) document.exitPointerLock()
        void reportFinish(false, endedAt)
      }
    }, 250)
    return () => clearInterval(id)
  }, [won, lost, runStartedAt, runDurationMs, world.grid, reportFinish])

  useEffect(() => {
    if (!world.grid) return
    const path = shortestPath(world.grid)
    const turns = getTurns(path, world.grid)
    console.log(
      `[maze] seed=${world.grid.seed} size=${world.grid.width}x${world.grid.height} path_len=${path.length} decisive_turns=${turns.length} doors=${world.doors.length}`,
    )
  }, [world])

  // Proximity loop: nearest door + end-cell win trigger
  useEffect(() => {
    if (!world.grid) return
    let raf = 0
    const endX = world.grid.end.x * CELL_SIZE
    const endY = world.grid.end.y * CELL_SIZE
    const loop = () => {
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

      if (!won && !lost && world.doors.length > 0) {
        const allUnlocked = world.doors.every(d => d.status === 'unlocked')
        if (allUnlocked) {
          const dx = playerState.x - endX
          const dy = playerState.y - endY
          if (Math.sqrt(dx * dx + dy * dy) < END_RADIUS) {
            const endedAt = Date.now()
            setWon(true)
            setRunEndedAt(endedAt)
            setOpenDialogDoorId(null)
            if (document.pointerLockElement === document.body) {
              document.exitPointerLock()
            }
            void reportFinish(true, endedAt)
          }
        }
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [world.doors, world.grid, won, lost, reportFinish])

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
        if (openDialogDoorId || !nearbyDoorId) return
        const d = world.doors.find(x => x.id === nearbyDoorId)
        if (!d || d.status !== 'locked') return
        e.preventDefault()
        if (document.pointerLockElement === document.body) document.exitPointerLock()
        setOpenDialogDoorId(nearbyDoorId)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [regenerate, devUnlockAll, nearbyDoorId, openDialogDoorId, world.doors, won, lost])

  const openDoor = openDialogDoorId
    ? world.doors.find(d => d.id === openDialogDoorId) ?? null
    : null

  const handlePromptSent = useCallback(() => setPromptCount(p => p + 1), [])

  const handleDoorUnlocked = useCallback(() => {
    if (!openDialogDoorId) return
    const id = openDialogDoorId
    setWorld(w => ({
      ...w,
      doors: w.doors.map(d => (d.id === id ? { ...d, status: 'unlocked' } : d)),
    }))
    setOpenDialogDoorId(null)
    if (document.pointerLockElement !== document.body) {
      try {
        const req = document.body.requestPointerLock() as unknown as
          | Promise<void>
          | undefined
        if (req && typeof req.then === 'function') req.catch(() => {})
      } catch {}
    }
  }, [openDialogDoorId])

  const closeDialog = useCallback(() => setOpenDialogDoorId(null), [])

  const nearbyDoor = nearbyDoorId
    ? world.doors.find(d => d.id === nearbyDoorId) ?? null
    : null
  const promptStatus = nearbyDoor && !openDialogDoorId
    ? nearbyDoor.status === 'locked'
      ? 'locked'
      : null
    : null

  const inventoryItems: InventoryItem[] = session?.inventoryItems ?? []
  const allowLanguageToggle = session?.allowLanguageToggle ?? true

  if (!world.grid) {
    return (
      <div className="session-loading">
        {sessionError ? (
          <div className="session-banner session-banner--error">
            Server not reachable: {sessionError}
          </div>
        ) : (
          <div className="session-banner">Loading game…</div>
        )}
      </div>
    )
  }

  // Silence unused-import warning when MAZE_WIDTH/HEIGHT serve only as fallback
  void mazeWidth
  void mazeHeight

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
            nearbyDoorId={nearbyDoorId}
          />
        </Physics>
      </Canvas>
      <RunStatsHUD
        startedAt={runStartedAt}
        endedAt={runEndedAt}
        promptCount={promptCount}
        durationMs={runDurationMs}
        lost={lost}
      />
      <ProximityPrompt status={promptStatus} />
      {minimapVisible && (
        <MazeOverview grid={world.grid} doors={world.doors} onRegenerate={regenerate} />
      )}
      {sessionError && !session && (
        <div className="session-banner session-banner--error">
          Server not reachable: {sessionError}
        </div>
      )}
      {openDoor && session && (
        <ChatDialog
          door={openDoor}
          sessionId={session.sessionId}
          inventoryItems={inventoryItems}
          language={language}
          onLanguageChange={allowLanguageToggle ? setLanguage : () => {}}
          onPromptSent={handlePromptSent}
          onUnlocked={handleDoorUnlocked}
          onClose={closeDialog}
        />
      )}
      {won && runEndedAt !== null && (
        <WinScreen
          elapsedMs={runEndedAt - runStartedAt}
          promptCount={promptCount}
          rank={finishResult?.rank ?? null}
          totalCompleted={finishResult?.totalCompleted}
          prizes={session?.prizes}
          onRestart={requestRestartFromHost}
        />
      )}
      {lost && (
        <LoseScreen
          doorsUnlocked={world.doors.filter(d => d.status === 'unlocked').length}
          totalDoors={world.doors.length}
          promptCount={promptCount}
          onRestart={requestRestartFromHost}
        />
      )}
    </>
  )
}

export function PhysicsWorld({
  grid,
  doors,
  nearbyDoorId,
}: {
  grid: MazeGrid
  doors: Door[]
  nearbyDoorId: string | null
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
        nearbyDoorId={nearbyDoorId}
      />
    </Suspense>
  )
}
