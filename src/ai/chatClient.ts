import { ChatLanguage, FinishRunResponse, StartRunResponse } from '../game/puzzles'
import * as httpClient from './httpClient'

export type { StreamChatHandlers } from './httpClient'

// In production, the mock client is never used (isMockMode returns false
// early). The conditional require here lets webpack tree-shake the mock
// module out of the production bundle, so mock secrets and personas don't
// ship to end users.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const mockClient: any =
  process.env.NODE_ENV !== 'production'
    // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
    ? require('./mockClient')
    : null

function isMockMode(): boolean {
  if (typeof window === 'undefined') return true
  if (process.env.NODE_ENV === 'production') return false
  const params = new URLSearchParams(window.location.search)
  if (params.get('mock') === '1') return true
  if (params.has('apiBase')) return false
  return !process.env.REACT_APP_API_BASE
}

const impl = isMockMode() && mockClient ? mockClient : httpClient

export function startRun(): Promise<StartRunResponse> {
  return impl.startRun()
}

export function streamChat(
  args: Parameters<typeof httpClient.streamChat>[0],
  handlers: Parameters<typeof httpClient.streamChat>[1],
): Promise<void> {
  return impl.streamChat(args, handlers)
}

export function submitDoor(args: {
  sessionId: string
  doorId: string
  guess?: string
  tools?: string[]
}): Promise<{ ok: boolean }> {
  return impl.submitDoor(args)
}

export function finishRun(args: {
  sessionId: string
  elapsedMs: number
  promptCount: number
  completed: boolean
}): Promise<FinishRunResponse> {
  return impl.finishRun(args)
}

export type { ChatLanguage }
