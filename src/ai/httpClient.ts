import { ChatLanguage, FinishRunResponse, StartRunResponse } from '../game/puzzles'

function readApiBase(): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get('apiBase')
    if (fromUrl) return fromUrl.replace(/\/$/, '')
  }
  return (process.env.REACT_APP_API_BASE || '').replace(/\/$/, '')
}

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function readGameId(): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    return params.get('gameId') || 'default'
  }
  return 'default'
}

function readStartContext(): {
  language?: ChatLanguage
  userId?: string
  userName?: string
  userSurname?: string
  userPhone?: string
  userEmail?: string
  acceptedTerms?: boolean
  clientSeed?: string
  sessionId?: string
} {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const out: ReturnType<typeof readStartContext> = {}
  const lang = params.get('lang')
  if (lang === 'ka' || lang === 'en') out.language = lang
  const userId = params.get('userId')
  if (userId) out.userId = userId
  const userName = params.get('userName')
  if (userName) out.userName = userName
  const userSurname = params.get('userSurname')
  if (userSurname) out.userSurname = userSurname
  const userPhone = params.get('userPhone')
  if (userPhone) out.userPhone = userPhone
  const userEmail = params.get('userEmail')
  if (userEmail) out.userEmail = userEmail
  const acceptedTerms = params.get('acceptedTerms')
  if (acceptedTerms === '1' || acceptedTerms === 'true') out.acceptedTerms = true
  const seed = params.get('clientSeed')
  if (seed) out.clientSeed = seed
  const sessionId = params.get('sessionId')
  if (sessionId) out.sessionId = sessionId
  return out
}

export async function startRun(): Promise<StartRunResponse> {
  const base = readApiBase()
  const body = { gameId: readGameId(), ...readStartContext() }
  const res = await fetch(`${base}/api/game/run/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`startRun: HTTP ${res.status}`)
  return res.json()
}

export type StreamChatHandlers = {
  onChunk: (text: string) => void
  onDone: () => void
  onError: (message: string) => void
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
  const base = readApiBase()
  const res = await fetch(`${base}/api/game/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...authHeaders(),
    },
    body: JSON.stringify({
      sessionId: args.sessionId,
      doorId: args.doorId,
      language: args.language,
      message: args.message,
    }),
    signal: args.signal,
  })
  if (!res.ok || !res.body) {
    handlers.onError(`HTTP ${res.status}`)
    return
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  const dispatch = (event: string, data: string) => {
    try {
      const json = JSON.parse(data)
      if (event === 'chunk' && typeof json.text === 'string') {
        handlers.onChunk(json.text)
      } else if (event === 'done') {
        handlers.onDone()
      } else if (event === 'error') {
        handlers.onError(String(json.message || 'unknown'))
      }
    } catch {}
  }

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let blank
    while ((blank = buf.indexOf('\n\n')) !== -1) {
      const raw = buf.slice(0, blank)
      buf = buf.slice(blank + 2)
      let event = 'message'
      let data = ''
      for (const line of raw.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) data += line.slice(5).trim()
      }
      if (data) dispatch(event, data)
    }
  }
}

export async function submitDoor(args: {
  sessionId: string
  doorId: string
  guess?: string
  tools?: string[]
}): Promise<{ ok: boolean }> {
  const base = readApiBase()
  const res = await fetch(`${base}/api/game/door/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({
      sessionId: args.sessionId,
      doorId: args.doorId,
      guess: args.guess,
      tools: args.tools,
    }),
  })
  if (!res.ok) throw new Error(`submitDoor: HTTP ${res.status}`)
  return res.json()
}

export async function finishRun(args: {
  sessionId: string
  elapsedMs: number
  promptCount: number
  completed: boolean
}): Promise<FinishRunResponse> {
  const base = readApiBase()
  const res = await fetch(`${base}/api/game/run/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(args),
  })
  if (!res.ok) throw new Error(`finishRun: HTTP ${res.status}`)
  return res.json()
}
