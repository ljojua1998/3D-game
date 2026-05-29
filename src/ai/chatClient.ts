import { ChatLanguage, FinishRunResponse, StartRunResponse } from '../game/puzzles'
import * as httpClient from './httpClient'
import * as mockClient from './mockClient'

export type { StreamChatHandlers } from './httpClient'

function isMockMode(): boolean {
  if (typeof window === 'undefined') return true
  const params = new URLSearchParams(window.location.search)
  if (params.get('mock') === '1') return true
  if (params.has('apiBase')) return false
  return !process.env.REACT_APP_API_BASE
}

const impl = isMockMode() ? mockClient : httpClient

if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log(`[promptmaze] ai client mode: ${isMockMode() ? 'mock' : 'http'}`)
}

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
