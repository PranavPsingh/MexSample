import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clamp } from '../lib/math'

const HeroScene = lazy(() => import('../scene/HeroScene'))

const STAGES = [
  { n: '01', t: 'Axonometric', d: 'Flat, coloured, drawn.' },
  { n: '02', t: 'Isometric + plan', d: 'The drawing stands up.' },
  { n: '03', t: 'Exploded', d: 'Pick a piece to open the work.' },
]

export default function Home() {
  const nav = useNavigate()
  const [stage, setStage] = useState(0)
  const stageRef = useRef(0)
  const lock = useRef(0)

  const go = useCallback((d: number) => {
    const now = performance.now()
    if (now < lock.current) return
    const n = clamp(stageRef.current + d, 0, 2)
    if (n === stageRef.current) return
    stageRef.current = n
    lock.current = now + 900
    setStage(n)
  }, [])

  const jump = (n: number) => {
    stageRef.current = n
    lock.current = performance.now() + 900
    setStage(n)
  }

  useEffect(() => {
    document.body.classList.add('no-scroll')
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (Math.abs(e.deltaY) < 8) return
      go(e.deltaY > 0 ? 1 : -1)
    }
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault()
        go(1)
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        go(-1)
      }
    }
    let y0 = 0
    const ts = (e: TouchEvent) => (y0 = e.touches[0].clientY)
    const te = (e: TouchEvent) => {
      const dy = y0 - e.changedTouches[0].clientY
      if (Math.abs(dy) > 40) go(dy > 0 ? 1 : -1)
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', ts, { passive: true })
    window.addEventListener('touchend', te, { passive: true })
    return () => {
      document.body.classList.remove('no-scroll')
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', ts)
      window.removeEventListener('touchend', te)
    }
  }, [go])

  const s = STAGES[stage]
  return (
    <main className="home">
      <div className="home-canvas">
        <Suspense fallback={<div className="loading">Loading the drawing…</div>}>
          <HeroScene stage={stage} onSelect={(id) => nav(`/portfolio?open=${id}`)} />
        </Suspense>
      </div>

      <div className="hud">
        <div className="hud-title">
          <p className="note">Portfolio + Sale</p>
          <h1>
            Mehak
            <br />
            Singh
          </h1>
          <p className="hud-sub">Architecture, drawings, art &amp; small objects.</p>
        </div>

        <div className="hud-stage" aria-live="polite">
          <span className="note">{s.n} / 03</span>
          <b>{s.t}</b>
          <span>{s.d}</span>
          <div className="dots">
            {STAGES.map((x, i) => (
              <button key={x.n} className={i === stage ? 'on' : ''} onClick={() => jump(i)} aria-label={`Stage ${x.n}: ${x.t}`} />
            ))}
          </div>
          {stage === 2 ? (
            <button className="btn solid" onClick={() => nav('/portfolio')}>
              <span>All projects →</span>
            </button>
          ) : (
            <span className="hint">Scroll ↓</span>
          )}
        </div>
      </div>
    </main>
  )
}
