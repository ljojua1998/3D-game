import { StartRunResponse } from './puzzles'
import { MAZE_WIDTH, MAZE_HEIGHT, DEMO_DOOR_COUNT } from '../config'

// Builds a fully local "run" for the standalone demo build — no backend call.
// The doors carry placeholder persona/theme because the demo never opens the
// AI chat dialog (doors unlock instantly on "T"), but the existing
// maze/door-placement pipeline still expects a StartRunResponse shape.
export function buildDemoSession(): StartRunResponse {
  const doors = Array.from({ length: DEMO_DOOR_COUNT }, (_, i) => ({
    id: `demo-door-${i + 1}`,
    type: 'secret-word' as const,
    displayConfig: {
      type: 'secret-word' as const,
      persona: { en: `Gate ${i + 1}`, ka: `კარი ${i + 1}` },
      theme: {
        en: 'Press T to open.',
        ka: 'გასაღებად დააჭირე T.',
      },
    },
  }))

  return {
    sessionId: 'demo-session',
    doors,
    inventoryItems: [],
    maze: { width: MAZE_WIDTH, height: MAZE_HEIGHT, doorCount: DEMO_DOOR_COUNT },
    mazeSeed: null,
    // Long enough that the demo never times out while someone is showing it off.
    runDurationMs: 60 * 60 * 1000,
    defaultLanguage: 'ka',
    allowLanguageToggle: false,
    languages: ['ka', 'en'],
  }
}
