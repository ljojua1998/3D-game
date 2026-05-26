import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeWoodTexture(): CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const rand = mulberry32(2024)

  ctx.fillStyle = '#120a06'
  ctx.fillRect(0, 0, size, size)

  const plankCount = 5
  const plankW = size / plankCount
  const gap = 3

  for (let p = 0; p < plankCount; p++) {
    const x = p * plankW
    const base = 52 + rand() * 32
    const r = Math.min(255, base + 22)
    const g = Math.min(255, base + 2)
    const b = Math.max(0, base - 22)
    ctx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`
    ctx.fillRect(x + gap, 0, plankW - gap * 2, size)

    for (let s = 0; s < 16; s++) {
      const gy = rand() * size
      const ga = 0.08 + rand() * 0.18
      const gh = 0.7 + rand() * 1.8
      ctx.fillStyle = `rgba(18, 10, 6, ${ga})`
      ctx.fillRect(x + gap, gy, plankW - gap * 2, gh)
    }

    for (let s = 0; s < 8; s++) {
      const fx = x + gap + rand() * (plankW - gap * 2)
      const fa = 0.06 + rand() * 0.12
      ctx.fillStyle = `rgba(40, 24, 14, ${fa})`
      ctx.fillRect(fx, 0, 0.6, size)
    }

    ctx.fillStyle = 'rgba(255, 220, 180, 0.06)'
    ctx.fillRect(x + gap, 0, 1, size)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
    ctx.fillRect(x + plankW - gap - 1, 0, 1, size)

    const ringCount = 1 + Math.floor(rand() * 2)
    for (let rg = 0; rg < ringCount; rg++) {
      const ry = 40 + rand() * (size - 80)
      const rx = x + plankW / 2 + (rand() - 0.5) * (plankW - gap * 2) * 0.6
      const rr = 4 + rand() * 6
      ctx.strokeStyle = 'rgba(15, 8, 4, 0.6)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.ellipse(rx, ry, rr * 1.6, rr, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = 'rgba(10, 6, 3, 0.85)'
      ctx.beginPath()
      ctx.ellipse(rx, ry, rr * 0.45, rr * 0.3, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const studColor = '#1a1814'
  const studHighlight = '#5a5246'
  for (let p = 0; p < plankCount; p++) {
    const cx = p * plankW + plankW / 2
    for (const sy of [22, size - 22]) {
      ctx.fillStyle = studColor
      ctx.beginPath()
      ctx.arc(cx, sy, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = studHighlight
      ctx.beginPath()
      ctx.arc(cx - 1, sy - 1, 1.4, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * 10
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n))
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n))
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n))
  }
  ctx.putImageData(img, 0, 0)

  const tex = new CanvasTexture(canvas)
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

let cached: CanvasTexture | null = null
export function getWoodTexture(): CanvasTexture {
  if (!cached) cached = makeWoodTexture()
  return cached
}
