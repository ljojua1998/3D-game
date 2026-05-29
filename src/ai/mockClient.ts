import {
  ChatLanguage,
  DoorDisplayConfig,
  InventoryItem,
  LocalizedText,
  StartRunResponse,
} from '../game/puzzles'
import type { StreamChatHandlers } from './httpClient'

type MockSecretPuzzle = {
  id: string
  kind: 'secret-word'
  secret: { en: string; ka: string }
  persona: LocalizedText
  theme: LocalizedText
  hints: LocalizedText[]
}

type MockToolsPuzzle = {
  id: string
  kind: 'tools'
  requiredTools: string[]
  persona: LocalizedText
  theme: LocalizedText
  hints: LocalizedText[]
}

type MockPuzzle = MockSecretPuzzle | MockToolsPuzzle

const SECRET_PUZZLES: MockSecretPuzzle[] = [
  {
    id: 'sw_moon',
    kind: 'secret-word',
    secret: { en: 'moon', ka: 'მთვარე' },
    persona: { en: 'Silver Watcher', ka: 'ვერცხლის მცველი' },
    theme: {
      en: 'A pale guardian who tends the night sky.',
      ka: 'ფერმკრთალი დარაჯი, ღამის ცას რომ უვლის.',
    },
    hints: [
      {
        en: 'I am pale, and I only walk when the sun is sleeping.',
        ka: 'ფერმკრთალი ვარ და მხოლოდ მაშინ დავდივარ, როცა მზე იძინებს.',
      },
      {
        en: 'Sailors look up at me to find their way across the dark water.',
        ka: 'მენავეები ჩემთან იხედებიან, რომ ბნელ წყალში გზა იპოვონ.',
      },
      {
        en: 'I have phases — sometimes whole, sometimes only a sliver.',
        ka: 'მე ფაზები მაქვს — ხან მთლიანი ვარ, ხან მხოლოდ ნაჭერი.',
      },
      {
        en: 'I pull the tides, but I never touch the sea.',
        ka: 'მე ვტაცებ მოქცევებს, მაგრამ ზღვას არასოდეს ვეხები.',
      },
    ],
  },
  {
    id: 'sw_river',
    kind: 'secret-word',
    secret: { en: 'river', ka: 'მდინარე' },
    persona: { en: 'The Stone Boatman', ka: 'ქვის მენავე' },
    theme: {
      en: 'An old boatman who only moves in one direction.',
      ka: 'მოხუცი მენავე, რომელიც მხოლოდ ერთ მიმართულებას იცნობს.',
    },
    hints: [
      {
        en: 'I am born high in the mountains and die in the sea.',
        ka: 'მაღალ მთებში ვიბადები და ზღვაში ვკვდები.',
      },
      {
        en: 'I have a bed but I never sleep, banks but no money.',
        ka: 'საწოლი მაქვს, მაგრამ არასოდეს ვიძინებ; ნაპირები მაქვს, მაგრამ ფული არა.',
      },
      {
        en: 'Bridges are built to defeat me; boats to befriend me.',
        ka: 'ხიდები ჩემზე გასამარჯვებლად შენდება, ნავები — დასამეგობრებლად.',
      },
      {
        en: 'I always run, but I never grow tired.',
        ka: 'სულ ვრბივარ და არასოდეს ვიღლები.',
      },
    ],
  },
  {
    id: 'sw_mirror',
    kind: 'secret-word',
    secret: { en: 'mirror', ka: 'სარკე' },
    persona: { en: 'The Hollow Twin', ka: 'შიშველი ტყუპი' },
    theme: {
      en: 'A guardian who only repeats what it sees.',
      ka: 'მცველი, რომელიც მხოლოდ იმეორებს იმას, რასაც ხედავს.',
    },
    hints: [
      {
        en: 'I show you yourself, but reversed.',
        ka: 'მე გიჩვენებ შენ თავს, მაგრამ შებრუნებულად.',
      },
      {
        en: 'I am made of glass and silver, and I keep no secrets.',
        ka: 'მინისგან და ვერცხლისგან ვარ შექმნილი და საიდუმლოს არ ვინახავ.',
      },
      {
        en: 'Vampires fear me; vain ones cannot leave me.',
        ka: 'ვამპირები მეშინიათ; ამპარტავნები ვერ მშორდებიან.',
      },
      {
        en: 'Break me and you get seven years of bad luck — or so they say.',
        ka: 'გამტეხ — შვიდი წელი ცუდი ბედი მოგყვება, ასე ამბობენ.',
      },
    ],
  },
]

const TOOLS_PUZZLES: MockToolsPuzzle[] = [
  {
    id: 'tp_climb',
    kind: 'tools',
    requiredTools: ['rope', 'torch'],
    persona: { en: 'The Pit Warden', ka: 'მღვიმის მცველი' },
    theme: {
      en: 'Behind this door is a deep dark pit. You must descend and see.',
      ka: 'ამ კარს უკან ღრმა და ბნელი ორმოა. უნდა ჩახვიდე და დაინახო.',
    },
    hints: [
      {
        en: "You'll fall a long way down, and the bottom is black as ink.",
        ka: 'შორს უნდა ჩახვიდე, ფსკერი მელანივით შავია.',
      },
      {
        en: "You need two things: a way down without breaking your legs, and a way to see at the bottom.",
        ka: 'ორი რამ გჭირდება: ჩასვლის საშუალება ფეხის გადაუმტვრევლად, და ფსკერზე დანახვის საშუალება.',
      },
      {
        en: "Climbers carry the first. Cavers carry the second.",
        ka: 'მთამსვლელები პირველს ატარებენ. გამოქვაბულის მკვლევარები — მეორეს.',
      },
      {
        en: "Without light you are blind. Without a tether you are doomed.",
        ka: 'შუქის გარეშე ბრმა ხარ. დაბმის გარეშე — განწირული.',
      },
    ],
  },
  {
    id: 'tp_unlock',
    kind: 'tools',
    requiredTools: ['key', 'crowbar'],
    persona: { en: 'The Iron Steward', ka: 'რკინის მცველი' },
    theme: {
      en: 'A second lock and a stuck hinge stand between you and the next hall.',
      ka: 'მეორე საკეტი და დაჭედილი ანჯამა გიყოფს მომდევნო დარბაზისგან.',
    },
    hints: [
      {
        en: "One mechanism turns. The other is rusted and refuses to move.",
        ka: 'ერთი მექანიზმი ბრუნავს. მეორე დაჟანგულია და უარს ამბობს მოძრაობაზე.',
      },
      {
        en: "You'll need something small and shaped, and something long and stubborn.",
        ka: 'რაღაც პატარა და ფორმიანი დაგჭირდება, და რაღაც გრძელი და ჯიუტი.',
      },
      {
        en: "Don't try to pick the lock — its match exists. The hinge needs leverage.",
        ka: 'საკეტი არ აარჩი — მისი წყვილი არსებობს. ანჯამას ბერკეტი სჭირდება.',
      },
    ],
  },
  {
    id: 'tp_spirit',
    kind: 'tools',
    requiredTools: ['mirror', 'bell'],
    persona: { en: 'The Veiled Priest', ka: 'ფარდიანი მღვდელი' },
    theme: {
      en: 'A spirit blocks the way; it must be reflected and called to peace.',
      ka: 'სული გადგია გზაზე; აუცილებელია მისი ანარეკლი და მშვიდი მოწოდება.',
    },
    hints: [
      {
        en: "Spirits cannot bear to see their own face. Show it back to them.",
        ka: 'სულები ვერ იტანენ თავიანთი სახის დანახვას. დაუბრუნე.',
      },
      {
        en: "A ringing sound, soft and silver, can lay a restless soul to peace.",
        ka: 'ხმოვანი ბგერა, რბილი და ვერცხლის, ურისდარჩენელ სულს დააწყნარებს.',
      },
      {
        en: "Glass and metal — one to repeat, one to ring.",
        ka: 'მინა და ლითონი — ერთი იმეორებს, მეორე — რეკავს.',
      },
    ],
  },
]

const INVENTORY: InventoryItem[] = [
  { id: 'rope', label: { en: 'Rope', ka: 'თოკი' }, icon: '🪢' },
  { id: 'torch', label: { en: 'Torch', ka: 'ჩირაღდანი' }, icon: '🔥' },
  { id: 'key', label: { en: 'Brass Key', ka: 'სპილენძის გასაღები' }, icon: '🗝️' },
  { id: 'mirror', label: { en: 'Mirror Shard', ka: 'სარკის ნამსხვრევი' }, icon: '🪞' },
  { id: 'crowbar', label: { en: 'Crowbar', ka: 'ლომი' }, icon: '🛠️' },
  { id: 'bell', label: { en: 'Silver Bell', ka: 'ვერცხლის ზარი' }, icon: '🔔' },
  { id: 'compass', label: { en: 'Compass', ka: 'კომპასი' }, icon: '🧭' },
  { id: 'rune', label: { en: 'Stone Rune', ka: 'ქვის რუნა' }, icon: '🪨' },
]

const REFUSAL: Record<ChatLanguage, string[]> = {
  ka: [
    'ჰა, კარგი ცდაა — მაგრამ ისე ადვილად ვერ მოგცემ პასუხს. სხვა შეკითხვა სცადე.',
    'ჩემგან პირდაპირ ვერ მოისმენ. იფიქრე ჩემს ნათქვამზე.',
  ],
  en: [
    'Nice try — but I will not hand you the answer directly. Ask another way.',
    'You won\'t hear it from me. Think about what I\'ve already said.',
  ],
}

type MockRunDoor = {
  id: string
  type: 'secret-word' | 'tools'
  puzzle: MockPuzzle
  unlocked: boolean
  turnCount: number
}

type MockRun = {
  sessionId: string
  doors: MockRunDoor[]
}

const runs = new Map<string, MockRun>()

function fnv1a(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

function newSessionId(): string {
  const buf = new Uint8Array(12)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf)
  } else {
    for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('')
}

function pickPuzzle<T>(pool: T[], sessionId: string, doorId: string): T {
  const h = fnv1a(`${sessionId}|${doorId}`)
  return pool[h % pool.length]
}

function publicDisplayConfig(p: MockPuzzle): DoorDisplayConfig {
  return {
    type: p.kind,
    persona: p.persona,
    theme: p.theme,
  }
}

function detectsDirectAsk(msg: string): boolean {
  const m = msg.toLowerCase()
  return (
    m.includes('what is the word') ||
    m.includes('tell me the word') ||
    m.includes('spell it') ||
    m.includes('first letter') ||
    m.includes('last letter') ||
    m.includes('what is the secret') ||
    m.includes('ჩაფიქრებული') ||
    m.includes('საიდუმლო') ||
    (m.includes('სიტყვა') && (m.includes('რა') || m.includes('მითხარი')))
  )
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

function pickHint(door: MockRunDoor, language: ChatLanguage, userMessage: string): string {
  if (door.puzzle.kind === 'secret-word' && detectsDirectAsk(userMessage)) {
    const pool = REFUSAL[language]
    return pool[door.turnCount % pool.length]
  }
  const hints = door.puzzle.hints
  return hints[door.turnCount % hints.length][language]
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

export async function startRun(): Promise<StartRunResponse> {
  await sleep(60)
  const sessionId = newSessionId()
  const door1Puzzle = pickPuzzle(SECRET_PUZZLES, sessionId, 'door-1')
  const door2Puzzle = pickPuzzle(TOOLS_PUZZLES, sessionId, 'door-2')
  const run: MockRun = {
    sessionId,
    doors: [
      {
        id: 'door-1',
        type: 'secret-word',
        puzzle: door1Puzzle,
        unlocked: false,
        turnCount: 0,
      },
      {
        id: 'door-2',
        type: 'tools',
        puzzle: door2Puzzle,
        unlocked: false,
        turnCount: 0,
      },
    ],
  }
  runs.set(sessionId, run)
  return {
    sessionId,
    doors: run.doors.map(d => ({
      id: d.id,
      type: d.type,
      displayConfig: publicDisplayConfig(d.puzzle),
    })),
    inventoryItems: INVENTORY,
    maze: { width: 10, height: 10, doorCount: 2 },
    runDurationMs: 10 * 60 * 1000,
    defaultLanguage: 'ka',
    allowLanguageToggle: true,
    languages: ['ka', 'en'],
  }
}

export async function finishRun(_args: {
  sessionId: string
  elapsedMs: number
  promptCount: number
  completed: boolean
}): Promise<{ ok: boolean; rank: number | null; totalCompleted: number; completed: boolean }> {
  await sleep(80)
  return { ok: true, rank: 1, totalCompleted: 1, completed: _args.completed }
}

export async function streamChat(
  args: {
    sessionId: string
    doorId: string
    language: ChatLanguage
    message: string
    signal?: AbortSignal
  },
  handlers: StreamChatHandlers,
): Promise<void> {
  const run = runs.get(args.sessionId)
  if (!run) {
    handlers.onError('unknown_session')
    return
  }
  const door = run.doors.find(d => d.id === args.doorId)
  if (!door) {
    handlers.onError('unknown_door')
    return
  }

  const reply = pickHint(door, args.language, args.message)
  door.turnCount += 1

  const tokens = reply.split(/(\s+)/)
  for (const t of tokens) {
    if (args.signal?.aborted) {
      handlers.onError('aborted')
      return
    }
    handlers.onChunk(t)
    await sleep(28 + Math.random() * 40)
  }
  handlers.onDone()
}

export async function submitDoor(args: {
  sessionId: string
  doorId: string
  guess?: string
  tools?: string[]
}): Promise<{ ok: boolean }> {
  await sleep(80)
  const run = runs.get(args.sessionId)
  if (!run) return { ok: false }
  const door = run.doors.find(d => d.id === args.doorId)
  if (!door) return { ok: false }
  if (door.unlocked) return { ok: true }

  if (door.puzzle.kind === 'secret-word') {
    const g = normalize(args.guess || '')
    const ok =
      !!g &&
      (g === normalize(door.puzzle.secret.en) || g === normalize(door.puzzle.secret.ka))
    if (ok) door.unlocked = true
    return { ok }
  }

  const need = door.puzzle.requiredTools
  const got = args.tools || []
  let ok = need.length === got.length
  if (ok) {
    const gotSet: Record<string, true> = {}
    for (const g of got) gotSet[g] = true
    for (const t of need) {
      if (!gotSet[t]) {
        ok = false
        break
      }
    }
  }
  if (ok) door.unlocked = true
  return { ok }
}
