# Architecture

How the game is wired together, and the knobs you can turn to change the maze.

## Game flow

```
App.tsx
 └─ <Canvas>                      three.js renderer + default camera
     └─ <Physics>                 cannon-es physics world (web worker)
         └─ <PhysicsWorld>
             ├─ <GroundPlane>     infinite static floor
             ├─ <FPSControls>    player capsule + camera (WASD / mouse)
             └─ <GameDirector>   the actual game content
```

`GameDirector` runs the scripted sequence:

1. **EarlyGame** — the spawn room, the mouse ("algernon"), the whiteboards and
   cheese. Hand-authored geometry loaded from a `.glb` model.
2. **Petals** — 11 pre-built short corridors (`createPetal1`..`createPetal11`).
   They branch off toward the Flower Room. Reaching enough dead ends triggers
   "the world changes around you" and drops you into the open maze.
3. **Infinite maze** — from that point one petal is kept and its
   `customSegmentGenerationFunction` takes over, procedurally extending the maze
   as you walk and spawning scripted rooms (flower / fountain / deer / orb) and
   finally the tombstone ending.

## The maze system

### Segments

A maze is a chain of `MazeSegment`s. Each segment has a `type`, a world
`position` / `rotation`, and a list of `connections` (where other segments can
attach). The basic pieces live in `src/components/maze-pieces/MazeLibrary.ts`:

- `MazeStraightSegment` — a corridor with two ends
- `MazeCornerSegment` — a 90° turn
- `MazeDeadEndSegment` — a closed end (one connection)

Each piece has a matching React component (`MazeStraight.tsx`, `MazeCorner.tsx`,
`MazeDeadEnd.tsx`) that renders the walls as boxes with physics colliders.
`get-segment-component.ts` maps a segment `type` string to its component.

### Infinite1DMaze

`Infinite1DMazeSegment` is a *manager* that holds a 1D chain of segments and
extends/trims it around the player:

- As you walk **forward**, segments are appended ahead of you.
- As you walk away from them, old segments **behind** you are removed.
- It always keeps a buffer of turns visible in both directions so you can never
  see the maze pop into existence.

`Infinite1DMaze.tsx` is the React component that renders whichever segments the
manager currently holds.

### Tunable knobs

| Constant            | File                                    | Effect |
|---------------------|-----------------------------------------|--------|
| `MAZE_BUFFER_SIZE`  | `infinite-1d-maze/Infinite1DMazeSegment.ts` | How many turns are kept loaded ahead/behind the player. Higher = a much longer visible maze (and more physics bodies). Currently **6**. |
| `MAZEPIECE_HALFWIDTH` | `maze-pieces/MazeLibrary.ts`          | Corridor half-width. ⚠️ Changing this alone does **not** resize the walls — the wall meshes in `MazeStraight/Corner/DeadEnd.tsx` use hard-coded offsets that must be updated to match. |
| `MAZEPIECE_HEIGHT`  | `maze-pieces/MazeLibrary.ts`            | Wall height. |
| `WIN_ROOM_DEPTH`    | `maze-pieces/customSegmentGeneration.ts`| How many forward segments before the win room is spawned (see below). |

### Procedural generation

`customSegmentGeneration.ts` holds `CustomSegmentGenerationFunction`s. When an
`Infinite1DMazeSegment` has a `customSegmentGenerationFunction` set, that
function decides what piece spawns next instead of a plain random straight/
corner. The original game chains them:

```
spawnNoFutureNoPast → spawnFlower → spawnFountain → spawnDeer → spawnOrb
→ spawnTheEnd → spawnDeadEndsOnly
```

Each function rolls a chance to spawn its scripted room, then hands off to the
next function in the chain.

## The win room

`end-game/WinRoom.tsx` defines a celebratory dead-end room: a glowing rotating
trophy, a "YOU WIN!" banner, and an applause/party-horn sting when the player
walks in. `WinRoomSegment` has a single connection, so once it is placed the
maze stops extending forward — you've reached the end.

`spawnMazeWithWinRoom` (in `customSegmentGeneration.ts`) is a generation
function that spawns ordinary pieces until `forwardSegmentCount` reaches
`WIN_ROOM_DEPTH`, then caps the maze with a `WinRoomSegment`.

**Status:** the win room is built but not wired into the default game flow yet.
To use it you would point a maze's `customSegmentGenerationFunction` at
`spawnMazeWithWinRoom`, or swap `TheEndSegment` for `WinRoomSegment` inside
`spawnTheEnd`.

## Adding a new room type

1. Create a `MazeSegment` subclass with the right `connections` (see
   `TheEndSegment` / `WinRoomSegment` for one-connection rooms).
2. Create a React component that renders it (reuse `MazeDeadEnd` for the walls
   if it's a dead-end-shaped room, like `WinRoom.tsx` does).
3. Add a `case` for the new `type` string in `get-segment-component.ts`.
4. Return the new segment from a `CustomSegmentGenerationFunction` so the maze
   can spawn it.

## Camera & controls notes

The FPS camera uses a Z-up world (`camera.up = (0,0,1)`) and `YZX` Euler order
so that mouse-X is yaw and mouse-Y is pitch. These are set explicitly in
`FPSControls.tsx` on mount — don't remove them or the look/move controls break.

The player is a physics capsule. Because the cannon worker doesn't reliably sync
the body transform back onto its mesh, `FPSControls` subscribes to the body
position directly and drives the camera from that.
