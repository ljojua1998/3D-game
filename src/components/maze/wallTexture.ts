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

  ctx.fillStyle = '#1a1612'
  ctx.fillRect(0, 0, size, size)

  const brickH = 50
  const brickW = 110
  const pad = 3

  for (let row = 0; row * brickH < size + brickH; row++) {
    const y = row * brickH
    const offset = (row % 2) * (brickW / 2)
    for (let col = -1; col * brickW + offset < size + brickW; col++) {
      const x = col * brickW + offset
      const bw = brickW - pad * 2 + (rand() - 0.5) * 6
      const bh = brickH - pad * 2 + (rand() - 0.5) * 4

      const roll = rand()
      let r: number
      let g: number
      let b: number
      if (roll < 0.12) {
        const base = 32 + rand() * 38
        r = base + 12
        g = base - 4
        b = Math.max(8, base - 12)
      } else if (roll < 0.28) {
        const base = 95 + rand() * 35
        r = base + 22
        g = base - 22
        b = Math.max(18, base - 42)
      } else {
        const base = 145 + rand() * 55
        r = Math.min(240, base + 28 + rand() * 14)
        g = Math.min(160, base * 0.55 + rand() * 12)
        b = Math.min(110, base * 0.32 + rand() * 12)
      }
      ctx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`
      ctx.fillRect(x + pad, y + pad, bw, bh)

      ctx.fillStyle = 'rgba(0, 0, 0, 0.32)'
      ctx.fillRect(x + pad, y + pad + bh - 3, bw, 3)
      ctx.fillRect(x + pad + bw - 3, y + pad, 3, bh)

      ctx.fillStyle = 'rgba(255, 220, 180, 0.09)'
      ctx.fillRect(x + pad, y + pad, bw, 1.5)
      ctx.fillRect(x + pad, y + pad, 1.5, bh)

      const grimeSpots = Math.floor(rand() * 3)
      for (let s = 0; s < grimeSpots; s++) {
        const cx = x + pad + rand() * bw
        const cy = y + pad + rand() * bh
        const cr = 1 + rand() * 3
        ctx.fillStyle = `rgba(10, 6, 4, ${0.25 + rand() * 0.3})`
        ctx.beginPath()
        ctx.arc(cx, cy, cr, 0, Math.PI * 2)
        ctx.fill()
      }

      if (rand() < 0.25) {
        const cx = x + pad + rand() * bw
        const cy = y + pad + rand() * bh
        const cr = 2 + rand() * 4
        ctx.fillStyle = `rgba(255, 210, 170, ${0.08 + rand() * 0.1})`
        ctx.beginPath()
        ctx.arc(cx, cy, cr, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  for (let i = 0; i < 6; i++) {
    const sx = rand() * size
    const sy = rand() * size
    const sw = 30 + rand() * 80
    const sh = 6 + rand() * 18
    ctx.save()
    ctx.translate(sx, sy)
    ctx.rotate((rand() - 0.5) * 0.4)
    ctx.fillStyle = `rgba(15, 8, 5, ${0.12 + rand() * 0.18})`
    ctx.fillRect(-sw / 2, -sh / 2, sw, sh)
    ctx.restore()
  }

  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * 14
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
