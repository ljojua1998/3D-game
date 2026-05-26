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

  ctx.fillStyle = '#150e08'
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
      if (roll < 0.18) {
        const base = 30 + rand() * 28
        r = base + 12
        g = base + 4
        b = Math.max(8, base - 8)
      } else if (roll < 0.62) {
        const base = 70 + rand() * 35
        r = base + 22
        g = base + 4
        b = Math.max(10, base - 22)
      } else {
        const base = 110 + rand() * 45
        r = Math.min(220, base + 42 + rand() * 18)
        g = Math.min(170, base + 10 + rand() * 10)
        b = Math.max(20, base - 38 + rand() * 8)
      }
      ctx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`
      ctx.fillRect(x + pad, y + pad, bw, bh)

      ctx.fillStyle = 'rgba(0, 0, 0, 0.38)'
      ctx.fillRect(x + pad, y + pad + bh - 2, bw, 2)
      ctx.fillRect(x + pad + bw - 2, y + pad, 2, bh)

      ctx.fillStyle = 'rgba(230, 180, 100, 0.12)'
      ctx.fillRect(x + pad, y + pad, bw, 1)
      ctx.fillRect(x + pad, y + pad, 1, bh)

      const grimeSpots = Math.floor(rand() * 3)
      for (let s = 0; s < grimeSpots; s++) {
        const cx = x + pad + rand() * bw
        const cy = y + pad + rand() * bh
        const cr = 0.6 + rand() * 2.2
        ctx.fillStyle = `rgba(6, 4, 2, ${0.35 + rand() * 0.3})`
        ctx.beginPath()
        ctx.arc(cx, cy, cr, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  for (let i = 0; i < 14; i++) {
    const cx = rand() * size
    const cy = rand() * size
    const baseRad = 35 + rand() * 60
    for (let blob = 0; blob < 6; blob++) {
      const ox = (rand() - 0.5) * baseRad * 1.7
      const oy = (rand() - 0.5) * baseRad * 1.2
      const r = baseRad * (0.4 + rand() * 0.6)
      const goldR = 165 + rand() * 55
      const goldG = 115 + rand() * 35
      const goldB = 35 + rand() * 25
      const alpha = 0.22 + rand() * 0.3
      const grad = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r)
      grad.addColorStop(0, `rgba(${goldR | 0}, ${goldG | 0}, ${goldB | 0}, ${alpha})`)
      grad.addColorStop(0.6, `rgba(${(goldR - 30) | 0}, ${(goldG - 20) | 0}, ${(goldB - 10) | 0}, ${alpha * 0.5})`)
      grad.addColorStop(1, `rgba(${goldR | 0}, ${goldG | 0}, ${goldB | 0}, 0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2)
      ctx.fill()
    }
    for (let s = 0; s < 8; s++) {
      const sx = cx + (rand() - 0.5) * baseRad * 1.8
      const sy = cy + (rand() - 0.5) * baseRad * 1.4
      const sr = 1.2 + rand() * 2.5
      const a = 0.45 + rand() * 0.3
      ctx.fillStyle = `rgba(${(220 + rand() * 30) | 0}, ${(170 + rand() * 30) | 0}, ${(80 + rand() * 20) | 0}, ${a})`
      ctx.beginPath()
      ctx.arc(sx, sy, sr, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  for (let i = 0; i < 9; i++) {
    const cx = rand() * size
    const cy = rand() * size
    const baseRad = 28 + rand() * 55
    for (let blob = 0; blob < 4; blob++) {
      const ox = (rand() - 0.5) * baseRad * 1.5
      const oy = (rand() - 0.5) * baseRad * 1.0
      const r = baseRad * (0.5 + rand() * 0.5)
      const alpha = 0.3 + rand() * 0.3
      const grad = ctx.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r)
      grad.addColorStop(0, `rgba(8, 5, 2, ${alpha})`)
      grad.addColorStop(1, 'rgba(8, 5, 2, 0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(cx + ox, cy + oy, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  for (let i = 0; i < 22; i++) {
    const cx = rand() * size
    const cy = rand() * size
    const r = 1.5 + rand() * 4
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    grad.addColorStop(0, `rgba(255, 210, 130, ${0.55 + rand() * 0.3})`)
    grad.addColorStop(1, 'rgba(255, 210, 130, 0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
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
