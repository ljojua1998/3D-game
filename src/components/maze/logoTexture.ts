import { useEffect, useState } from 'react'
import { CanvasTexture, LinearFilter, SRGBColorSpace, Texture } from 'three'

export const LOGO_URL = '/textures/croco-squad.svg'
export const LOGO_ASPECT = 251 / 32

const RASTER_WIDTH = 1024

let cached: Promise<CanvasTexture> | null = null

async function rasterize(): Promise<CanvasTexture> {
  const img = new Image()
  img.src = LOGO_URL
  await img.decode()
  const w = RASTER_WIDTH
  const h = Math.max(1, Math.round(w / LOGO_ASPECT))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8
  tex.minFilter = LinearFilter
  tex.needsUpdate = true
  return tex
}

export function loadLogoTexture(): Promise<CanvasTexture> {
  if (!cached) cached = rasterize()
  return cached
}

export function useLogoTexture(): Texture | null {
  const [tex, setTex] = useState<Texture | null>(null)
  useEffect(() => {
    let alive = true
    loadLogoTexture().then(t => {
      if (alive) setTex(t)
    })
    return () => {
      alive = false
    }
  }, [])
  return tex
}
