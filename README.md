# Squad Maze (PromptMaze) — AI-guarded 3D maze game widget

A first-person 3D maze game, built with React + Three.js + a physics engine and
shipped as a **thin frontend widget**. Players spawn at one corner of a
procedurally generated maze, walk to AI-guarded doors, talk their way past each
guard (or pick the right tools), and race a countdown timer to the exit. The
widget is embedded as an `<iframe>` inside a host site (the Squad Quiz / Croco
admin app), where **all backend logic — AI calls, puzzle secrets, leaderboard,
persistence — lives on the host side**. The widget never sees an API key or a
puzzle answer.

The codebase runs in two shapes (one product):

1. **Hosted widget** — embedded iframe talking to a host backend over
   `/api/game/*` (the production booth build).
2. **Mock mode** — a fully client-side dev mode with in-memory puzzles + a fake
   streaming "AI", so the game is playable with no backend (`npm start`).

- **Status:** Active development. The frontend widget is functional; the backend
  is host-owned and specified, not implemented in this repo.
- **URL (deployed widget):** TBD
- **Languages:** Georgian (`ka`, default) + English (`en`), runtime-toggleable.
- **Repository:** https://github.com/ljojua1998/3D-game.git
- **Default branch:** `main`.
- **Host backend spec:** [`docs/HOST_BACKEND_SPEC.md`](docs/HOST_BACKEND_SPEC.md)

---

## Architecture

```
                         URL params (apiBase, gameId, token, lang, userId…)
                                       │
┌───────────────────────┐   <iframe>   ▼   ┌──────────────────────────────────────┐
│  Host site            │──────────────────│  Squad Maze widget (static CRA bundle)│
│  (Next.js admin/play) │                  │                                       │
│                       │   postMessage    │  index.tsx → App.tsx                  │
│  embeds the widget,   │◀─────────────────│   ├─ <Canvas>  three.js renderer      │
│  listens for          │  ready/started/  │   │   └─ <Physics> cannon-es worker   │
│  lifecycle events     │  finished/…      │   │       ├─ FPSControls (player)     │
└───────────┬───────────┘                  │   │       ├─ GroundPlane / Skydome    │
            │                              │   │       └─ PromptMazeDirector       │
            │ HTTP (fetch + SSE)           │   │           └─ GeneratedMaze        │
            ▼                              │   │               (walls/doors/floor) │
┌───────────────────────┐                 │   └─ HUD / ChatDialog / Win/Lose UI    │
│  Host backend /api/game│                 │                                       │
│   run/start            │   ai/chatClient.ts switches impl:                       │
│   chat (SSE)           │     ├─ httpClient → real backend (/api/game/*)          │
│   door/submit          │     └─ mockClient → in-memory puzzles (dev only)        │
│   run/finish           │                 │                                       │
│   (+ config, leaderbd) │                 └──────────────────────────────────────┘
│                        │
│  AI provider (Gemini / │   Puzzle secrets + AI keys live ONLY here; the widget
│  Claude / …) + DB      │   receives only public display config (persona/theme).
└───────────────────────┘
```

The maze itself is generated **client-side** and deterministically from a seed
(`game/MazeGenerator.ts`), so the backend only needs to send a maze size, a door
count, and per-door public display config — never the layout. A desktop build is
also available via Electron (`src/electron.js`) wrapping the same web bundle.

---

## Layers

| Layer | Technology / Module | Description |
|---|---|---|
| Language | TypeScript 4.9 (`strict`) | Whole `src/` tree; target ES5, `react-jsx`. |
| UI framework | React 18 (`react`, `react-dom`) | Component tree, run lifecycle in `App.tsx`. |
| 3D rendering | three.js 0.169, `@react-three/fiber` 8, `@react-three/drei` 9 | Canvas, camera, meshes, textures. |
| Physics | `@react-three/cannon` 6 + `cannon-es` (web worker) | Player capsule + wall colliders. |
| Maze engine | `game/MazeGenerator.ts`, `pathfinding.ts`, `pathAnalysis.ts`, `doors.ts`, `rng.ts` | DFS recursive-backtracker maze + deterministic door placement on corridor turns. |
| Backend client | `ai/chatClient.ts`, `httpClient.ts`, `mockClient.ts` | Impl switch: real backend / in-memory mock. |
| Host bridge | `ai/postMessage.ts` | `window.parent.postMessage` lifecycle events. |
| Styling | Sass (`src/index.scss`) | Neon "tech-maze" theme, custom scrollbars, HUD/overlays. |
| Build | `react-scripts` 5 (Create React App) | Dev server, production bundle. |
| Process manager | Foreman (`nf`) + `Procfile` | Runs CRA + Electron together in `npm run dev`. |
| Desktop | Electron 33 + Electron Forge 7 | `src/electron.js` main process; Forge makers (squirrel/zip/deb/rpm). |
| Persistence / auth / AI | **Host-owned** (not in this repo) | See [`docs/HOST_BACKEND_SPEC.md`](docs/HOST_BACKEND_SPEC.md). |
| Testing | `react-scripts test` (Jest + Testing Library), `setupTests.js` | Configured; no spec files present yet. |
| Deployment | Vercel (`vercel.json`) / static copy into host / Electron Forge | CRA static `build/` output. |

---

## External Dependencies

| Service | Purpose |
|---|---|
| Host backend `/api/game/*` | Source of run sessions, AI chat (SSE), door validation, run results. Required for the hosted build; bypassed in mock mode. |
| AI provider (Gemini / Claude / …) | Generates guard replies. Reached **only** through the host's `/api/game/chat` route — the widget never calls it directly. |
| Vercel | Optional static hosting target for the widget bundle (`vercel.json`). |
| Electron binary CDN | Downloaded at install time for the desktop build (often blocked by corporate SSL — see Getting Started). |

---

## Project Structure

```
.
├── public/
│   ├── index.html              CRA HTML shell
│   ├── models/                 .glb assets
│   ├── sounds/                 applause / party-horn stings
│   ├── assets/  fonts/  items/ textures, fonts, item icons
│   └── thumbnail.png  squad-maze.svg
├── src/
│   ├── index.tsx               React 18 entry point
│   ├── App.tsx                 Canvas, camera, physics world, full run lifecycle
│   │                           (session load, timer, win/lose, key handling)
│   ├── config.ts               MAZE_WIDTH/HEIGHT fallbacks, debug flags
│   ├── theme.ts                colours / fog
│   ├── electron.js             Electron main process (BrowserWindow)
│   ├── electron-dev.js         waits for the CRA dev server, then launches Electron
│   ├── ai/
│   │   ├── chatClient.ts        selects impl: mock (dev) vs http (real backend)
│   │   ├── httpClient.ts        real backend: fetch + SSE against /api/game/*
│   │   ├── mockClient.ts        in-memory puzzles + fake streaming AI (no backend)
│   │   └── postMessage.ts       emits promptmaze:* lifecycle events to the host
│   ├── game/
│   │   ├── MazeGenerator.ts     DFS recursive-backtracker grid maze
│   │   ├── rng.ts               mulberry32 PRNG + seed helpers (deterministic)
│   │   ├── pathfinding.ts       shortest path start→end
│   │   ├── pathAnalysis.ts      corridor turns along the path (door anchors)
│   │   ├── doors.ts             places doors on chosen turns, world transforms
│   │   ├── puzzles.ts           shared types (DoorSpec, StartRunResponse, …)
│   │   ├── gameState.ts         global mirror of doors/won/lost
│   │   ├── playerState.ts       global mirror of player position
│   │   ├── zones.ts  circuit.ts neon-trace / decorative geometry
│   │   └── constants.ts         CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS, DOOR_THICKNESS
│   ├── components/
│   │   ├── PromptMazeDirector.tsx  thin wrapper that renders GeneratedMaze
│   │   ├── three/                  FPSControls, GroundPlane, Skydome
│   │   ├── maze/                   Wall, Door, NeonFloor, GeneratedMaze, MazeOverview,
│   │   │                           Window, WallLogo + *Texture helpers
│   │   └── ui/                     ChatDialog, WinScreen, LoseScreen, ProximityPrompt,
│   │                               RunStatsHUD, InventoryPanel
│   └── helpers/sound.ts
├── docs/
│   ├── HOST_BACKEND_SPEC.md     authoritative host backend + admin spec (DB, API, AI)
│   ├── BACKEND_HANDOFF_PROMPT.md backend hand-off prompt
│   └── ARCHITECTURE.md          ⚠ legacy (describes the old infinite-maze design)
├── scripts/phase1-distribution.mjs
├── Procfile                    foreman: react + electron processes
├── vercel.json                 Vercel build config
├── .env                        BROWSER=none
└── package.json
```

> Note: `docs/ARCHITECTURE.md` predates the current finite seeded-maze design and
> is kept for history only; `HOST_BACKEND_SPEC.md` is the authoritative backend
> reference.

---

## Prerequisites

- **Node.js 18+** (tested on Node 22).
- npm (the repo pins `legacy-peer-deps=true` in `.npmrc`).
- For the **hosted** build: a running host backend exposing `/api/game/*`
  (see [`docs/HOST_BACKEND_SPEC.md`](docs/HOST_BACKEND_SPEC.md)) — not needed for
  mock mode.
- For the **desktop** build: ability to download the Electron binary (corporate
  SSL inspection can block this — workaround below).
- No accounts or API keys are required by the widget itself; AI keys live on the
  host backend.

---

## Getting Started

1. **Clone**

   ```bash
   git clone https://github.com/ljojua1998/3D-game.git
   cd 3D-game
   ```

2. **Install dependencies**

   ```bash
   npm install --legacy-peer-deps
   ```

   `--legacy-peer-deps` is required because React 18 / three.js / react-scripts 5
   peer ranges don't all agree (it's also pinned in `.npmrc`).

   **Behind a corporate proxy / SSL inspection?** If install fails downloading the
   Electron binary (`self-signed certificate in certificate chain`), do it in two
   steps:

   ```bash
   ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install --legacy-peer-deps
   cd node_modules/electron && NODE_TLS_REJECT_UNAUTHORIZED=0 node install.js
   ```

   The web build (`npm start`) works without the second step.

3. **External setup (hosted mode only)** — stand up the host backend per
   `docs/HOST_BACKEND_SPEC.md` (four tables + the `/api/game/*` endpoints). Skip
   this entirely for mock mode.

4. **Configure environment** — the widget needs almost no env; most config comes
   from URL params at runtime (see How It Works).

   `.env` (committed):

   ```bash
   BROWSER=none          # don't auto-open a browser tab on `npm start`
   ```

   | Variable | Required | Description |
   |---|---|---|
   | `BROWSER` | no | `none` stops CRA opening a browser tab. |
   | `REACT_APP_API_BASE` | no | Default backend base URL when no `apiBase` URL param is given. If unset (and not `?mock=1`), dev falls back to mock mode. |
   | `PORT` | no | Dev server port (default 3000). |
   | `ELECTRON_START_URL` | no | Override the URL Electron loads (used by `electron-dev.js`). |
   | `ELECTRON_SKIP_BINARY_DOWNLOAD` | no | Set `1` to skip the Electron binary download during install. |

5. **Run (web, mock mode — no backend needed)**

   ```bash
   npm start
   ```

   Opens a dev server on http://localhost:3000. With no `apiBase` param and no
   `REACT_APP_API_BASE`, it runs the in-memory mock client automatically. Force
   it with `?mock=1`.

6. **First use** — click the canvas to lock the mouse, move with `W A S D`, walk
   up to a glowing door, press `T` to talk to its AI guard, clear all doors, then
   reach the far corner to win.

---

## How It Works

The widget resolves which backend to talk to at startup, loads a run, generates
a winnable maze locally, then runs a proximity/timer loop until the player wins,
loses, or time expires.

### Flow 1 — Run lifecycle (hosted mode)

```
host iframe ──URL params──▶ App.loadSession()
                               │  emit  promptmaze:ready
                               ▼
                    POST /api/game/run/start ──▶ { sessionId, doors[], maze, … }
                               │
                generateValidMaze(w,h,seed,minTurns)  ← deterministic seed search
                computeDoors(grid, doors)             ← place doors on corridor turns
                               │  emit  promptmaze:run-started
                               ▼
        ┌───── player walks ──────────────────────────────────┐
        │  near locked door + T  → ChatDialog                   │
        │     POST /api/game/chat (SSE: event:chunk / done)     │
        │     POST /api/game/door/submit { guess | tools }      │
        │  all doors unlocked + reach end-cell → WIN            │
        │  timer expires OR 3 wrong guesses on a door → LOSE    │
        └───────────────────────┬──────────────────────────────┘
                               ▼
                    POST /api/game/run/finish ──▶ { ok, rank, totalCompleted }
                               │  emit  promptmaze:run-finished
                               ▼
                 Win/Lose screen → restart hands control back to host
                                   (emit promptmaze:user-requested-restart)
```

Steps:

1. The host embeds the iframe with URL params (`apiBase`, `gameId`, `token`,
   `lang`, optional `userId`/`userName`/`sessionId`…). On mount the widget emits
   `promptmaze:ready`.
2. `App.loadSession()` calls `POST /api/game/run/start` (body: `gameId` + start
   context). The response defines maze size, door count, per-door public
   `displayConfig`, run duration, and languages.
3. `generateValidMaze()` builds a maze and **searches seeds deterministically**
   until the shortest path has enough corridor turns for every door (so no door
   is dropped and the run is always winnable). `computeDoors()` then anchors each
   door on a turn.
4. Approaching a locked door shows a proximity prompt; pressing `T` opens
   `ChatDialog`, which streams guard replies from `POST /api/game/chat` (SSE) and
   submits answers to `POST /api/game/door/submit`.
5. When all doors are unlocked and the player reaches the end cell, the run is
   won; `POST /api/game/run/finish` persists the result and returns a provisional
   rank. The win/lose screen restart emits `promptmaze:user-requested-restart`
   so the host can register the next player.

### Backend client selection (`ai/chatClient.ts`)

| Condition | Implementation |
|---|---|
| `process.env.NODE_ENV === 'production'` | `httpClient` (real backend); mock module is tree-shaken out. |
| `?mock=1` URL param (dev) | `mockClient` (in-memory). |
| `?apiBase=…` present (dev) | `httpClient`. |
| No `apiBase` and no `REACT_APP_API_BASE` (dev) | `mockClient`. |

### Run modes

| Mode | Backend | Doors | Door unlock | Restart | Toggle |
|---|---|---|---|---|---|
| Hosted | `/api/game/*` | from `run/start` | AI chat + submit | hands back to host | production build |
| Mock | none (in-memory) | 2 (10×10 maze) | AI chat + submit (fake stream) | hands back to host | dev default / `?mock=1` |

### Door puzzle types

| Type | Goal | Validation |
|---|---|---|
| `secret-word` | Coax a hidden word out of the guard, then submit it | Case/punctuation-insensitive match against `ka`/`en` secret (server-side). |
| `tools` | Infer which inventory items the obstacle needs, then submit them | Set-equality against the required tool ids (server-side). |

### Controls

| Input | Action |
|---|---|
| Click | Lock the mouse pointer |
| `W` `A` `S` `D` | Move |
| Mouse | Look around |
| `Left Shift` | Sprint (2× speed) |
| `T` | Talk to the nearby door's AI guard |
| `M` | Toggle minimap overview |
| `Esc` | Pause / release pointer (or close the chat dialog) |
| `G` | Regenerate maze (dev builds only) |
| `Shift` + `U` | Unlock all doors (dev builds only) |

---

## Authentication Flow

The widget has **no login of its own**. It is gated entirely by the host, and the
defense-in-depth model keeps puzzle secrets server-side.

1. **Seed / register** — the host site authenticates the player (its own auth)
   and renders the iframe, passing identity + an optional bearer `token` and
   `sessionId` as URL params.
2. **Token forwarding** — `httpClient` reads `?token=…` and sends it as
   `Authorization: Bearer <token>` on every `/api/game/*` request. Start context
   (`userId`, `userName`, `userPhone`, `userEmail`, `acceptedTerms`, `clientSeed`,
   `isPreview`) is forwarded to `run/start`.
3. **Gate** — the host backend authorizes `run/start` (and may reject a stale
   resume with HTTP `410`, which makes the widget emit `promptmaze:resume-failed`
   so the host drops the URL `sessionId` and shows registration again).
4. **Defense in depth** — puzzle secrets (`secret_word_*`, `required_tool_ids`)
   and AI keys never reach the client. The widget only receives public
   `displayConfig` (persona + theme); answers are validated server-side at
   `door/submit`, and `prompt_count` / run-time are re-derived server-side to
   resist spoofing (see Security).

---

## Database Schema

**This repository contains no database and no migrations.** The widget is
stateless: a run lives in React state plus two in-memory mirrors (`gameState`,
`playerState`), and the deterministic maze is rebuilt from a seed. All
persistence is **host-owned**.

The host backend (per [`docs/HOST_BACKEND_SPEC.md`](docs/HOST_BACKEND_SPEC.md))
defines **4 tables**, with migrations managed on the host side (count host-owned,
not tracked here):

```
games            game config: slug, name, maze_width, maze_height, door_count,
                 run_duration_seconds, default_language, allow_language_toggle, active
puzzles          puzzle pool per game: type (secret-word|tools), secret_word_ka/en,
                 required_tool_ids[], persona_ka/en, theme_ka/en,
                 system_prompt_extra_ka/en, active, weight
inventory_items  shared tool catalog: id, label_ka/en, icon, active, sort_order
runs             one row per session (= sessionId): game_id, user_id, user_name,
                 language, doors (jsonb), started_at, ended_at, elapsed_ms,
                 prompt_count, doors_cleared, completed, expired
```

- The leaderboard is a query over `runs WHERE completed = true`, ordered by
  `elapsed_ms ASC, prompt_count ASC` — no separate table.
- **RLS / security:** secrets (`secret_word_*`, `required_tool_ids`) must never be
  serialized into any widget-facing response; they appear only in the chat
  system prompt and in `door/submit` validation, both server-side.

### Migrations

- **In this repo:** none (N/A — no database).
- **Host side:** migrations for the four tables above are owned by the host
  project; counts/filenames are TBD (not present in this repository).

---

## Security

| Layer | Implementation |
|---|---|
| Secret isolation | Puzzle answers + AI keys live only on the host; the widget receives public `displayConfig` only. |
| Transport auth | Optional `?token=` forwarded as `Authorization: Bearer <token>` on every `/api/game/*` call (`httpClient.authHeaders`). |
| Production hardening | Mock client + its secrets/personas are tree-shaken from the production bundle; dev hotkeys (`G`, `Shift+U`) stripped (`DEV_HOTKEYS = NODE_ENV !== 'production'`). |
| Winnability guard | `generateValidMaze` deterministically searches seeds so every door sits on a corridor turn — no silently unwinnable layouts. |
| Attempt cap | 3 wrong guesses per door → immediate loss (`MAX_WRONG_ATTEMPTS_PER_DOOR`). |
| Anti-spoof (host) | Server re-derives `prompt_count` and validates `elapsedMs` against server time at `run/finish`; rate-limits `/api/game/chat`. |
| Resume integrity | A rejected resume (HTTP `410`) triggers `promptmaze:resume-failed` so the host clears the stale `sessionId`. |
| iframe origin | `postMessage` is a no-op when running standalone (`window.parent === window`); host should set CORS per the spec when cross-origin. |

---

## Commands

```bash
# Install (required flag; also pinned in .npmrc)
npm install --legacy-peer-deps

# Dev — web only (mock mode if no backend configured), http://localhost:3000
npm start

# Dev — web + Electron window together (via Foreman / Procfile)
npm run dev

# Electron against an already-running dev server
npm run electron

# Production web build → ./build
npm run build

# Packaged desktop app (Electron Forge)
npm run make        # build + make installers
npm run package     # build + package (no installers)

# Tests (Jest + React Testing Library) — no spec files present yet
npm test
```

---

## Optional Configuration

| Setting | Location | Default | Effect |
|---|---|---|---|
| `MAZE_WIDTH` / `MAZE_HEIGHT` | `src/config.ts` | `10` / `10` | Fallback maze size when the backend doesn't supply one. |
| `MAZE_SEED` | `src/config.ts` | `null` | Pin a maze seed (`null` = random per run). |
| `DEBUG_CONNECTIONS` / `DEBUG_POSITION` | `src/config.ts` | `false` | Debug overlays. |
| `CELL_SIZE` / `WALL_HEIGHT` / `WALL_THICKNESS` / `DOOR_THICKNESS` | `src/game/constants.ts` | `4 / 2 / 1 / 0.3` | Maze geometry in world units. |
| `apiBase` (URL param) | runtime | — | Backend base URL (overrides `REACT_APP_API_BASE`). |
| `gameId` (URL param) | runtime | `default` | Which game the host serves. |
| `lang` (URL param) | runtime | `ka` | Starting language. |
| `mock` (URL param) | runtime | off | `1` forces mock mode in dev. |

Runtime URL params the widget reads: `apiBase`, `gameId`, `token`, `lang`,
`userId`, `userName`, `userSurname`, `userPhone`, `userEmail`, `acceptedTerms`,
`clientSeed`, `sessionId`, `isPreview`, `mock`.

---

## Deployment

The widget is a static Create React App bundle. Three targets:

1. **Static / CDN (recommended for the hosted booth)**
   ```bash
   npm run build
   ```
   Copy `build/*` into the host app (e.g. `public/play-widget/`) and embed:
   ```html
   <iframe src="https://your-cdn/play-widget/?apiBase=https://yoursite.com&gameId=demo&lang=ka"
           style="width:100%;height:720px;border:0" allow="autoplay"></iframe>
   ```
   `homepage: "./"` in `package.json` makes the build path-relative, so it works
   from any subfolder.

2. **Vercel** — `vercel.json` is preconfigured:
   - build: `npm run build`, output: `build`, framework: `create-react-app`
   - install: `ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install --legacy-peer-deps`
   - Deployed URL: TBD.

3. **Desktop (Electron Forge)**
   ```bash
   npm run make
   ```
   Produces installers (squirrel for Windows, zip for macOS, deb/rpm for Linux)
   wrapping the web build.

For cross-origin hosted deployments, set CORS on `/api/game/*` per
`docs/HOST_BACKEND_SPEC.md §4.2`.

---

## Testing

| Area | Coverage |
|---|---|
| Framework | `react-scripts test` (Jest + React Testing Library), `jest-dom`, `user-event`; bootstrap in `src/setupTests.js`. |
| Unit / component tests | None present yet (no `*.test.*` / `*.spec.*` files). |
| Type checking | `tsc --noEmit` (strict) — passes; also run during `npm run build`. |
| Manual smoke (mock) | `npm start` → play a full run end-to-end with no backend. |
| Backend contract | End-to-end cURL flow in `docs/HOST_BACKEND_SPEC.md §10`. |

---

## TBD / to confirm

The following could not be determined from the repository and need a maintainer
to fill in:

- Deployed widget URL (CDN) and Vercel project URL.
- Host backend repository link and its migration count / tooling (Prisma, etc.).
- Production AI provider + model actually used (`GEMINI_API_KEY` vs
  `ANTHROPIC_API_KEY`; `GAME_AI_MODEL`).
- Whether `GET /api/game/config` and `GET /api/game/leaderboard` are consumed by
  any host-side component (the widget itself only calls `run/start`, `chat`,
  `door/submit`, `run/finish`).
- Test suite plan / target coverage (currently no specs).
- License (currently `UNLICENSED` / private).
