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

  ctx.fillStyle = '#6a5d49'
  ctx.fillRect(0, 0, size, size)

  const brickH = 64
  const brickW = 128
  const pad = 3

  for (let row = 0; row * brickH < size + brickH; row++) {
    const y = row * brickH
    const offset = (row % 2) * (brickW / 2)
    for (let col = -1; col * brickW + offset < size + brickW; col++) {
      const x = col * brickW + offset
      const base = 198 + rand() * 38
      const r = Math.min(255, base + rand() * 12)
      const g = Math.min(255, base + rand() * 10 - 4)
      const b = Math.min(255, base + rand() * 8 - 10)
      ctx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${b | 0})`
      ctx.fillRect(x + pad, y + pad, brickW - pad * 2, brickH - pad * 2)

      ctx.fillStyle = 'rgba(0, 0, 0, 0.14)'
      ctx.fillRect(x + pad, y + brickH - pad - 4, brickW - pad * 2, 4)
      ctx.fillRect(x + brickW - pad - 3, y + pad, 3, brickH - pad * 2)

      ctx.fillStyle = 'rgba(255, 248, 230, 0.18)'
      ctx.fillRect(x + pad, y + pad, brickW - pad * 2, 2)
      ctx.fillRect(x + pad, y + pad, 2, brickH - pad * 2)

      const cracks = Math.floor(rand() * 2)
      for (let c = 0; c < cracks; c++) {
        const cx = x + pad + rand() * (brickW - pad * 2)
        const cy = y + pad + rand() * (brickH - pad * 2)
        const cr = 1 + rand() * 2
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)'
        ctx.beginPath()
        ctx.arc(cx, cy, cr, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * 18
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
