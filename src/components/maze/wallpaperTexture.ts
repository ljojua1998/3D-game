import { useEffect, useState } from 'react'
import { CanvasTexture, LinearFilter, SRGBColorSpace, Texture } from 'three'

// Decorative wall art. Each PNG is a simple silhouette/line-art shape; we
// ignore its source color and re-tint it to a palette color using its alpha
// as a mask, so every shape comes out as a clean solid tint.
const FILES = [
  '1 18.png', '2 15.png', '3 16.png', '4 15.png', '5 7.png', '6 2.png',
  '7 3.png', '8 1.png', '9 2.png', '10 1.png', '11.png', '12.png',
]

// Palette tints chosen to contrast with the Mindaro (#c7fd7c) walls.
// (Seasalt/Mindaro are skipped — they'd vanish against the light wall.)
const COLORS = ['#18b270', '#e471f4', '#41514d', '#0f1d35']

const RASTER = 256

function assetUrl(file: string): string {
  // Resolve relative to the document base so it works both standalone
  // (CRA dev) and embedded under /play-widget/ in the host app.
  return new URL(`assets/wallpapers/${file}`, document.baseURI).href
}

const imgCache = new Map<string, Promise<HTMLImageElement>>()
function loadImage(file: string): Promise<HTMLImageElement> {
  let p = imgCache.get(file)
  if (!p) {
    p = (async () => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = assetUrl(file)
      await img.decode()
      return img
    })()
    imgCache.set(file, p)
  }
  return p
}

async function makeTinted(file: string, color: string): Promise<CanvasTexture> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = RASTER
  canvas.height = RASTER
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, RASTER, RASTER)
  ctx.drawImage(img, 0, 0, RASTER, RASTER)
  // Keep the shape's alpha, replace its RGB with the palette tint.
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, RASTER, RASTER)
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = SRGBColorSpace
  tex.anisotropy = 8
  tex.minFilter = LinearFilter
  tex.needsUpdate = true
  return tex
}

let cached: Promise<CanvasTexture[]> | null = null
function loadAll(): Promise<CanvasTexture[]> {
  if (!cached) {
    const combos: Array<[string, string]> = []
    for (const f of FILES) for (const c of COLORS) combos.push([f, c])
    cached = Promise.all(combos.map(([f, c]) => makeTinted(f, c)))
  }
  return cached
}

// Returns the full set of tinted wall-art textures (12 shapes × 4 tints).
// Empty until the images have decoded and rasterized.
export function useWallpaperTextures(): Texture[] {
  const [texs, setTexs] = useState<Texture[]>([])
  useEffect(() => {
    let alive = true
    loadAll().then(t => {
      if (alive) setTexs(t)
    })
    return () => {
      alive = false
    }
  }, [])
  return texs
}
