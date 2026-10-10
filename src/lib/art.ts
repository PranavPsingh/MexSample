/**
 * Procedural "sample art" so the site looks alive before real images arrive.
 * Everything here is placeholder: swap `artDataUrl(...)` calls for real image URLs later.
 */
import { clamp } from './math'

export type ArtStyle = 'iso' | 'blobs' | 'lines'
export interface ArtSpec {
  seed: number
  palette: string[] // #rrggbb only
  style: ArtStyle
  bg?: string
}

export const INK = '#14120f'

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** amt < 0 darkens, amt > 0 lightens */
export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const f = (c: number) => Math.round(clamp(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt, 0, 255))
  return `rgb(${f(r)},${f(g)},${f(b)})`
}

type Rand = () => number

function drawIso(ctx: CanvasRenderingContext2D, w: number, h: number, r: Rand, spec: ArtSpec) {
  const N = 6
  const s = Math.min((w * 0.9) / (2 * N * 0.866), (h * 0.88) / (N + 5.4))
  const a = s * 0.866
  const ox = w / 2
  const oy = (h - (N + 5.4) * s) / 2 + 5.4 * s
  const P = (x: number, y: number, z: number): [number, number] => [
    ox + (x - y) * a,
    oy + (x + y) * 0.5 * s - z * s,
  ]
  const pal = spec.palette
  const cells: { i: number; j: number; hz: number; c: string }[] = []
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const piece = r() > 0.45
      cells.push({
        i,
        j,
        hz: piece ? 0.8 + Math.floor(r() * 28) / 10 : 0.2,
        c: piece ? pal[Math.floor(r() * pal.length)] : '#ffffff',
      })
    }
  }
  cells.sort((p, q) => p.i + p.j - (q.i + q.j))

  // soft ground shadow
  ctx.fillStyle = 'rgba(20,18,15,0.10)'
  ctx.beginPath()
  const sh = [P(0, 0, 0), P(N, 0, 0), P(N, N, 0), P(0, N, 0)]
  sh.forEach(([x, y], k) => (k ? ctx.lineTo(x + a * 0.8, y + s * 0.5) : ctx.moveTo(x + a * 0.8, y + s * 0.5)))
  ctx.fill()

  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(1.5, w / 330)
  ctx.strokeStyle = INK
  const face = (pts: [number, number][], fill: string) => {
    ctx.beginPath()
    pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
    ctx.closePath()
    ctx.fillStyle = fill
    ctx.fill()
    ctx.stroke()
  }
  for (const { i, j, hz, c } of cells) {
    face([P(i, j + 1, hz), P(i + 1, j + 1, hz), P(i + 1, j + 1, 0), P(i, j + 1, 0)], shade(c, -0.12))
    face([P(i + 1, j, hz), P(i + 1, j + 1, hz), P(i + 1, j + 1, 0), P(i + 1, j, 0)], shade(c, -0.3))
    face([P(i, j, hz), P(i + 1, j, hz), P(i + 1, j + 1, hz), P(i, j + 1, hz)], c)
  }

  // floating projected plan (dashed)
  const z = 5.4
  ctx.save()
  ctx.setLineDash([w / 60, w / 90])
  ctx.beginPath()
  ;[P(0, 0, z), P(N, 0, z), P(N, N, z), P(0, N, z)].forEach(([x, y], k) =>
    k ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
  )
  ctx.closePath()
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.fill()
  ctx.stroke()
  ctx.setLineDash([])
  ctx.beginPath()
  for (let k = 1; k < 4; k++) {
    const [x1, y1] = P(0, (N * k) / 4, z)
    const [x2, y2] = P(N * (0.4 + r() * 0.5), (N * k) / 4, z)
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
  }
  ctx.stroke()
  ctx.restore()
}

function drawBlobs(ctx: CanvasRenderingContext2D, w: number, h: number, r: Rand, spec: ArtSpec) {
  const pal = spec.palette
  ctx.globalCompositeOperation = 'multiply'
  for (let k = 0; k < 13; k++) {
    ctx.fillStyle = pal[Math.floor(r() * pal.length)]
    const x = r() * w
    const y = r() * h
    const sz = w * (0.12 + r() * 0.3)
    ctx.beginPath()
    const t = r()
    if (t < 0.4) ctx.arc(x, y, sz * 0.7, 0, Math.PI * 2)
    else if (t < 0.7) ctx.rect(x - sz / 2, y - sz / 2, sz, sz * (0.5 + r()))
    else ctx.arc(x, y, sz * 0.8, Math.PI, 0)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'
  ctx.strokeStyle = INK
  ctx.lineCap = 'round'
  for (let k = 0; k < 3; k++) {
    ctx.lineWidth = w / 70
    ctx.beginPath()
    ctx.moveTo(r() * w, r() * h)
    ctx.bezierCurveTo(r() * w, r() * h, r() * w, r() * h, r() * w, r() * h)
    ctx.stroke()
  }
  ctx.fillStyle = INK
  for (let k = 0; k < 90; k++) ctx.fillRect(r() * w, r() * h, 2, 2)
}

function drawLines(ctx: CanvasRenderingContext2D, w: number, h: number, r: Rand, spec: ArtSpec) {
  const pal = spec.palette
  ctx.lineCap = 'round'
  for (let k = 0; k < 6; k++) {
    ctx.strokeStyle = pal[k % pal.length]
    ctx.globalAlpha = 0.85
    ctx.lineWidth = w / 9
    ctx.beginPath()
    ctx.moveTo(r() * w, r() * h)
    ctx.quadraticCurveTo(r() * w, r() * h, r() * w, r() * h)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  ctx.strokeStyle = INK
  for (let k = 0; k < 46; k++) {
    ctx.lineWidth = 1 + r() * 2
    ctx.beginPath()
    const x = r() * w
    const y = r() * h
    ctx.moveTo(x, y)
    ctx.bezierCurveTo(x + (r() - 0.5) * w * 0.6, y + (r() - 0.5) * h * 0.3, x + (r() - 0.5) * w * 0.6, y + (r() - 0.5) * h * 0.4, x + (r() - 0.5) * w * 0.8, y + (r() - 0.5) * h * 0.5)
    ctx.stroke()
  }
}

export function makeArtCanvas(spec: ArtSpec, w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  ctx.fillStyle = spec.bg ?? '#f6f2e9'
  ctx.fillRect(0, 0, w, h)
  const r = rng(spec.seed)
  if (spec.style === 'iso') drawIso(ctx, w, h, r, spec)
  else if (spec.style === 'blobs') drawBlobs(ctx, w, h, r, spec)
  else drawLines(ctx, w, h, r, spec)
  return c
}

const cache = new Map<string, string>()
export function artDataUrl(spec: ArtSpec, w = 720, h = 900) {
  const key = `${spec.seed}|${spec.style}|${w}x${h}|${spec.palette.join(',')}|${spec.bg ?? ''}`
  let url = cache.get(key)
  if (!url) {
    url = makeArtCanvas(spec, w, h).toDataURL('image/png')
    cache.set(key, url)
  }
  return url
}
