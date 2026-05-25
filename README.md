# 3D-game

A first-person 3D maze game built with React, Three.js and a physics engine.
You spawn in a small room, follow scripted corridors, and then descend into a
procedurally generated infinite maze.

Based on [Algernon](https://github.com/nathanbabcock/algernon) by Nathan Babcock,
modernized to a current toolchain (React 18, `@react-three/fiber` 8,
`@react-three/drei` 9, `@react-three/cannon` 6, three.js 0.169, Electron 33).

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

## Credits

Original game: **Algernon** by Nathan Babcock (`excalo`).
This repository is a modernized fork used as a base for a new game.
