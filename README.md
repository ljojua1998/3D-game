# Squad Maze

A first-person 3D maze game widget built with React, Three.js and a physics
engine. Embedded as an iframe inside the Squad Quiz admin app for booth-style
gameplay: players register, descend into a procedurally generated maze with
AI-guarded doors, and race the timer to the exit.

Tooling: React 18, `@react-three/fiber` 8, `@react-three/drei` 9,
`@react-three/cannon` 6, three.js 0.169, Electron 33.

![Thumbnail](/public/thumbnail.png)

## Tech stack

| Area      | Library                                             |
|-----------|-----------------------------------------------------|
| UI        | React 18 + TypeScript                               |
| 3D        | three.js, `@react-three/fiber`, `@react-three/drei` |
| Physics   | `@react-three/cannon` (cannon-es worker)            |
| Desktop   | Electron 33 + Electron Forge 7                      |
| Build     | react-scripts 5 (Create React App)                  |
| Styling   | Sass                                                |

## Quick start

### Prerequisites

- Node.js 18+ (tested on Node 22)

### Install

```bash
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is required because the dependency set spans React 18 /
three.js / react-scripts 5 peer ranges that don't all agree.

> **Behind a corporate proxy / SSL inspection?** If `npm install` fails while
> downloading the Electron binary (`self-signed certificate in certificate
> chain`), install in two steps:
>
> ```bash
> ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install --legacy-peer-deps
> cd node_modules/electron && NODE_TLS_REJECT_UNAUTHORIZED=0 node install.js
> ```
>
> The first command installs all JS dependencies; the second fetches the
> Electron binary with certificate verification disabled. The web build
> (`npm start`) works without the second step.

### Run in the browser

```bash
npm start
```

Opens a dev server on http://localhost:3000.

### Run as a desktop app

```bash
npm run dev
```

Starts the React dev server and an Electron window together (via Foreman).

### Production build

```bash
npm run build      # web build into ./build
npm run make       # packaged desktop app (Electron Forge)
```

## Controls

| Input          | Action                          |
|----------------|---------------------------------|
| Click          | Lock the mouse pointer          |
| `W` `A` `S` `D`| Move                            |
| Mouse          | Look around                     |
| `Shift`        | Sprint                          |
| `Esc`          | Pause / release the pointer     |
| `R`            | Debug teleport (hackermode)     |
| `F`            | Place flowers at the grave (end)|

## Project structure

```
src/
  App.tsx                     Canvas, camera, physics world
  index.tsx                   React 18 entry point
  components/
    GameDirector.tsx          Scripted intro + transition into the maze
    three/                    Camera, FPS controls, ground, skydome, colliders
    maze-pieces/              Maze segment types + procedural generation
    infinite-1d-maze/         The procedurally extending maze
    early-game/               Scripted opening (spawn room, whiteboards, cheese)
    mid-game/                 Fountain / deer / orb rooms
    no-future-no-past/        Surreal maze section
    end-game/                 Tombstone ending + WinRoom
  helpers/                    Sound helpers
  config.ts                   Debug flags, location count
  theme.ts                    Colours
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the maze system works
and which knobs to turn to make it longer, bigger, or add new rooms.

## Current build (booth)

- **Visual**: pastel/neon "tech-maze" — vertical blue→pink gradient walls with
  green PCB circuit traces + neon edge glow, light floor with yellow corridor
  center-lines + circuit field + pink wall-foot lines, tinted decorative
  wallpapers on walls. Custom neon scrollbar in the AI chat.
- **Doors**: secret-word (guess input always visible) or tools (pick the right
  logos). 3 wrong guesses → lose. Win/lose screens hand control back to the host
  for the next player; WinScreen hides rank/prize (provisional at finish).
- **Maze**: deterministic seed search guarantees enough corridor turns for every
  door (no unwinnable layouts); identical maze on resume.
- **Dev hotkeys** (G regenerate, Shift+U unlock-all) are stripped from the
  production bundle; M (minimap) stays. Win sounds disabled.
- **Host bridge**: postMessage lifecycle events (`ready`, `run-started`,
  `run-finished`, `resume-failed`, `user-requested-restart`); APIs reached via
  `apiBase`/`gameId`/`sessionId` URL params.

Build (`npm run build`) → copy `build/*` into the host app's
`public/play-widget/`.
