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

function makeStoneTexture(): CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const rand = mulberry32(1337)

  ctx.fillStyle = '#5d4a3c'
  ctx.fillRect(0, 0, size, size)

  const brickH = 44
  const brickW = 102
  const pad = 2

  for (let row = 0; row * brickH < size + brickH; row++) {
    const y = row * brickH
    const offset = (row % 2) * (brickW / 2)
    for (let col = -1; col * brickW + offset < size + brickW; col++) {
      const x = col * brickW + offset
      const bw = brickW - pad * 2 + (rand() - 0.5) * 5
      const bh = brickH - pad * 2 + (rand() - 0.5) * 3

      const roll = rand()
      let r: number
      let g: number
      let b: number
      if (roll < 0.1) {
        const base = 75 + rand() * 30
        r = base + 18
        g = base - 6
        b = Math.max(20, base - 18)
      } else if (roll < 0.22) {
        const base = 195 + rand() * 30
        r = Math.min(245, base + 12)
        g = Math.min(215, base - 18)
        b = Math.min(190, base - 38)
      } else {
        const base = 130 + rand() * 40
        r = Math.min(220, base + 35 + rand() * 12)
        g = Math.min(135, base - 30 + rand() * 12)
        b = Math.min(110, base - 50 + rand() * 10)
      }
      ctx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`
      ctx.fillRect(x + pad, y + pad, bw, bh)

      ctx.fillStyle = 'rgba(0, 0, 0, 0.26)'
      ctx.fillRect(x + pad, y + pad + bh - 2, bw, 2)
      ctx.fillRect(x + pad + bw - 2, y + pad, 2, bh)

      ctx.fillStyle = 'rgba(255, 220, 180, 0.13)'
      ctx.fillRect(x + pad, y + pad, bw, 1)
      ctx.fillRect(x + pad, y + pad, 1, bh)

      const grimeSpots = Math.floor(rand() * 3)
      for (let s = 0; s < grimeSpots; s++) {
        const cx = x + pad + rand() * bw
        const cy = y + pad + rand() * bh
        const cr = 0.6 + rand() * 2
        ctx.fillStyle = `rgba(40, 24, 16, ${0.22 + rand() * 0.25})`
        ctx.beginPath()
        ctx.arc(cx, cy, cr, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  for (let i = 0; i < 7; i++) {
    const cx = rand() * size
    const cy = rand() * size
    const baseRad = 28 + rand() * 50
    for (let blob = 0; blob < 4; blob++) {
      const ox = (rand() - 0.5) * baseRad * 1.5
      const oy = (rand() - 0.5) * baseRad * 1.0
      const r = baseRad * (0.45 + rand() * 0.55)
      const alpha = 0.16 + rand() * 0.18
      const grad = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r)
      grad.addColorStop(0, `rgba(40, 24, 16, ${alpha})`)
      grad.addColorStop(1, 'rgba(40, 24, 16, 0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * 12
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
export function getStoneTexture(): CanvasTexture {
  if (!cached) cached = makeStoneTexture()
  return cached
}
