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

  ctx.fillStyle = '#3d3530'
  ctx.fillRect(0, 0, size, size)

  const brickH = 56
  const brickW = 110
  const pad = 4

  for (let row = 0; row * brickH < size + brickH; row++) {
    const y = row * brickH
    const offset = (row % 2) * (brickW / 2)
    for (let col = -1; col * brickW + offset < size + brickW; col++) {
      const x = col * brickW + offset
      const wJitter = (rand() - 0.5) * 16
      const hJitter = (rand() - 0.5) * 8
      const bw = brickW - pad * 2 + wJitter
      const bh = brickH - pad * 2 + hJitter

      const base = 132 + rand() * 38
      const r = Math.min(255, base + rand() * 12 + 6)
      const g = Math.min(255, base + rand() * 10 - 4)
      const b = Math.min(255, base + rand() * 8 - 18)
      ctx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`
      ctx.fillRect(x + pad, y + pad, bw, bh)

      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'
      ctx.fillRect(x + pad, y + pad + bh - 4, bw, 4)
      ctx.fillRect(x + pad + bw - 3, y + pad, 3, bh)

      ctx.fillStyle = 'rgba(255, 235, 200, 0.14)'
      ctx.fillRect(x + pad, y + pad, bw, 2)
      ctx.fillRect(x + pad, y + pad, 2, bh)

      const spots = Math.floor(rand() * 2)
      for (let c = 0; c < spots; c++) {
        const cx = x + pad + rand() * bw
        const cy = y + pad + rand() * bh
        const cr = 1 + rand() * 2.5
        ctx.fillStyle = 'rgba(20, 14, 10, 0.42)'
        ctx.beginPath()
        ctx.arc(cx, cy, cr, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  for (let i = 0; i < 18; i++) {
    const mx = rand() * size
    const my = rand() * (size * 0.65)
    const baseRad = 18 + rand() * 28
    for (let blob = 0; blob < 5; blob++) {
      const ox = (rand() - 0.5) * baseRad * 1.8
      const oy = (rand() - 0.5) * baseRad * 0.9
      const rad = baseRad * (0.4 + rand() * 0.6)
      const r = 55 + rand() * 35
      const g = 95 + rand() * 40
      const b = 28 + rand() * 22
      const alpha = 0.32 + rand() * 0.38
      ctx.fillStyle = `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${alpha})`
      ctx.beginPath()
      ctx.arc(mx + ox, my + oy, rad, 0, Math.PI * 2)
      ctx.fill()
    }
    for (let s = 0; s < 6; s++) {
      const sx = mx + (rand() - 0.5) * baseRad * 1.6
      const sy = my + (rand() - 0.5) * baseRad * 0.6
      const sr = 1.5 + rand() * 2
      ctx.fillStyle = `rgba(${(160 + rand() * 50) | 0}, ${(190 + rand() * 40) | 0}, ${(70 + rand() * 30) | 0}, 0.55)`
      ctx.beginPath()
      ctx.arc(sx, sy, sr, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * 16
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
