export type RNG = () => number

export function mulberry32(seed: number): RNG {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function xfnv1a(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  }
  return h >>> 0
}

export function rngFromSeed(seed: number | string | null): { rng: RNG; seed: number } {
  let n: number
  if (seed === null || seed === undefined) {
    n = (Math.random() * 0xFFFFFFFF) >>> 0
  } else if (typeof seed === 'string') {
    n = xfnv1a(seed)
  } else {
    n = seed >>> 0
  }
  return { rng: mulberry32(n), seed: n }
}

export function rngInt(rng: RNG, maxExclusive: number): number {
  return Math.floor(rng() * maxExclusive)
}

export function rngPick<T>(rng: RNG, arr: T[]): T {
  return arr[rngInt(rng, arr.length)]
}
