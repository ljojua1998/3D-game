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

function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i
    const px = cx + s * Math.cos(a)
    const py = cy + s * Math.sin(a)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

function makeFloorTexture(): CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const rand = mulberry32(9091)

  ctx.fillStyle = '#1a1a1c'
  ctx.fillRect(0, 0, size, size)

  const s = 30
  const drawS = s - 1.6
  const dx = 1.5 * s
  const dy = Math.sqrt(3) * s
  const cols = Math.ceil(size / dx) + 2
  const rows = Math.ceil(size / dy) + 2

  for (let c = -1; c < cols; c++) {
    for (let r = -1; r < rows; r++) {
      const cx = c * dx
      const cy = r * dy + ((((c % 2) + 2) % 2) * dy) / 2

      const roll = rand()
      let base: number
      if (roll < 0.04) base = 50 + rand() * 30
      else if (roll < 0.18) base = 140 + rand() * 30
      else base = 200 + rand() * 30

      const tintR = base + (rand() - 0.5) * 6
      const tintG = base + (rand() - 0.5) * 6
      const tintB = base + (rand() - 0.5) * 4
      ctx.fillStyle = `rgb(${tintR | 0}, ${tintG | 0}, ${tintB | 0})`
      hexPath(ctx, cx, cy, drawS)
      ctx.fill()

      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)'
      ctx.beginPath()
      ctx.moveTo(cx + drawS, 0 + cy)
      ctx.lineTo(cx + drawS / 2, cy + (Math.sqrt(3) / 2) * drawS)
      ctx.lineTo(cx + drawS / 2 - 1.8, cy + (Math.sqrt(3) / 2) * drawS - 1)
      ctx.lineTo(cx + drawS - 1.8, cy - 1)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)'
      ctx.beginPath()
      ctx.moveTo(cx - drawS, cy)
      ctx.lineTo(cx - drawS / 2, cy - (Math.sqrt(3) / 2) * drawS)
      ctx.lineTo(cx - drawS / 2 + 1.8, cy - (Math.sqrt(3) / 2) * drawS + 1)
      ctx.lineTo(cx - drawS + 1.8, cy + 1)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = `rgba(0, 0, 0, ${0.05 + rand() * 0.06})`
      ctx.beginPath()
      ctx.arc(cx + (rand() - 0.5) * drawS * 0.4, cy + (rand() - 0.5) * drawS * 0.4, 1 + rand() * 2.5, 0, Math.PI * 2)
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
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

let cached: CanvasTexture | null = null
export function getFloorTexture(): CanvasTexture {
  if (!cached) cached = makeFloorTexture()
  return cached
}
