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

  ctx.fillStyle = '#3a6a52'
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 32; i++) {
    const cx = rand() * size
    const cy = rand() * size
    const radius = 45 + rand() * 110
    const lighter = rand() < 0.5
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    if (lighter) {
      const a = 0.1 + rand() * 0.2
      const r = 110 + rand() * 28
      const g = 158 + rand() * 22
      const b = 124 + rand() * 18
      grad.addColorStop(0, `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${a})`)
      grad.addColorStop(1, `rgba(${r | 0}, ${g | 0}, ${b | 0}, 0)`)
    } else {
      const a = 0.12 + rand() * 0.22
      const r = 18 + rand() * 22
      const g = 42 + rand() * 22
      const b = 30 + rand() * 18
      grad.addColorStop(0, `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${a})`)
      grad.addColorStop(1, `rgba(${r | 0}, ${g | 0}, ${b | 0}, 0)`)
    }
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
  }

  for (let i = 0; i < 6; i++) {
    const sx = rand() * size
    const sy = rand() * size
    const sw = 90 + rand() * 220
    const sh = 4 + rand() * 14
    ctx.save()
    ctx.translate(sx, sy)
    ctx.rotate((rand() - 0.5) * 0.18)
    const grad = ctx.createLinearGradient(-sw / 2, 0, sw / 2, 0)
    const a = 0.08 + rand() * 0.14
    grad.addColorStop(0, 'rgba(120, 165, 130, 0)')
    grad.addColorStop(0.5, `rgba(120, 165, 130, ${a})`)
    grad.addColorStop(1, 'rgba(120, 165, 130, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(-sw / 2, -sh / 2, sw, sh)
    ctx.restore()
  }

  for (let i = 0; i < 280; i++) {
    const cx = rand() * size
    const cy = rand() * size
    const r = 0.6 + rand() * 2.4
    const a = 0.4 + rand() * 0.45
    ctx.fillStyle = `rgba(10, 20, 14, ${a})`
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let i = 0; i < 12; i++) {
    const cx = rand() * size
    const cy = rand() * size
    const r = 4 + rand() * 10
    const a = 0.18 + rand() * 0.22
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    grad.addColorStop(0, `rgba(8, 18, 12, ${a})`)
    grad.addColorStop(1, 'rgba(8, 18, 12, 0)')
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
