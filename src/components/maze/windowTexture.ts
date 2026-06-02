import { CanvasTexture, LinearFilter, SRGBColorSpace } from 'three'

function archPath(
  ctx: CanvasRenderingContext2D,
  W: number,
  innerR: number,
  bottom: number,
): void {
  ctx.beginPath()
  ctx.moveTo(W / 2 - innerR, bottom)
  ctx.lineTo(W / 2 + innerR, bottom)
  ctx.lineTo(W / 2 + innerR, innerR)
  ctx.arc(W / 2, innerR, innerR, 0, Math.PI, true)
  ctx.closePath()
}

function makeWindowTexture(): CanvasTexture {
  const W = 256
  const H = 512
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, W, H)

  const frame = 18
  const outerR = W / 2 - 2

  ctx.fillStyle = '#2a1814'
  archPath(ctx, W, outerR, H - 2)
  ctx.fill()

  const innerR = outerR - frame
  const innerBottom = H - 2 - frame
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#fff7e6')
  grad.addColorStop(0.35, '#ffeed4')
  grad.addColorStop(0.7, '#ffe1d4')
  grad.addColorStop(1, '#f0c4be')
  ctx.fillStyle = grad
  archPath(ctx, W, innerR, innerBottom)
  ctx.fill()

  ctx.save()
  archPath(ctx, W, innerR, innerBottom)
  ctx.clip()

  ctx.strokeStyle = '#2a1814'
  ctx.lineWidth = 6

  ctx.beginPath()
  ctx.moveTo(W / 2, 0)
  ctx.lineTo(W / 2, H)
  ctx.stroke()

  const rectTop = outerR
  const rectBottom = innerBottom
  for (let i = 1; i < 4; i++) {
    const y = rectTop + ((rectBottom - rectTop) / 4) * i
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }

  ctx.beginPath()
  ctx.moveTo(0, outerR * 0.55)
  ctx.lineTo(W, outerR * 0.55)
  ctx.stroke()

  const glow = ctx.createRadialGradient(W / 2, H * 0.45, 4, W / 2, H * 0.45, H * 0.42)
  glow.addColorStop(0, 'rgba(255, 250, 235, 0.55)')
  glow.addColorStop(0.5, 'rgba(255, 230, 200, 0.2)')
  glow.addColorStop(1, 'rgba(255, 230, 200, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  ctx.restore()

  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8
  tex.minFilter = LinearFilter
  tex.needsUpdate = true
  return tex
}

let cached: CanvasTexture | null = null
export function getWindowTexture(): CanvasTexture {
  if (!cached) cached = makeWindowTexture()
  return cached
}
