import { useEffect, useRef } from 'react'

interface Props {
  color?: string
  amp?: number
  freq?: number
  speed?: number
  sw?: number
  height?: number
  phase?: number
}

/** The "kind of squiggly moving lines" from the wireframe (Ed, Edd n Eddy style). Bulges toward the pointer. */
export default function Squiggle({ color = '#14120f', amp = 4, freq = 0.03, speed = 1.1, sw = 2, height = 28, phase = 0 }: Props) {
  const svg = useRef<SVGSVGElement>(null)
  const path = useRef<SVGPathElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let mx = 0.5
    const t0 = performance.now()
    const onMove = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth
    }
    const draw = (now: number) => {
      const el = svg.current
      const p = path.current
      if (!el || !p) return
      const w = el.clientWidth || 800
      const t = reduce ? 0 : (now - t0) / 1000
      const mid = height / 2
      let d = ''
      for (let x = 0; x <= w; x += 10) {
        const k = (x / w - mx) * 5
        const bump = 1 + 1.6 * Math.exp(-k * k)
        const y =
          mid +
          amp * bump * Math.sin(x * freq + t * speed + phase) +
          amp * 0.4 * Math.sin(x * freq * 2.3 - t * speed * 1.4 + phase)
        d += (x === 0 ? 'M' : 'L') + x + ' ' + y.toFixed(1) + ' '
      }
      p.setAttribute('d', d)
      if (!reduce) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    window.addEventListener('pointermove', onMove)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
    }
  }, [amp, freq, speed, height, phase])

  return (
    <svg ref={svg} className="squiggle" width="100%" height={height} aria-hidden>
      <path ref={path} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
