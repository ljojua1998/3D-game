export const DEBUG_CONNECTIONS = false
export const DEBUG_POSITION = false

export const MAZE_WIDTH = 15
export const MAZE_HEIGHT = 15
export const MAZE_SEED: number | null = null

// DEMO MODE — standalone showcase build, no backend required.
// When true the game runs fully client-side: a 15x15 maze with DEMO_DOOR_COUNT
// doors that open instantly on "T" (no AI chat / riddle), and the win screen
// restarts the run locally instead of handing control to an embedding host.
export const DEMO = true
export const DEMO_DOOR_COUNT = 5
