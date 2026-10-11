import { useCallback, useEffect, useRef, useState } from 'react'
import type { Project } from '../data/projects'
import { artDataUrl } from '../lib/art'
import { clamp } from '../lib/math'

/**
 * Two-card flip-book on desktop; mobile turns one full-width page at a time.
 *
 *  - slow / normal scroll: the bottom card swings UP over the spine and becomes the top card,
 *    the old top card fades away, the next card rises into the bottom slot.
 *  - fast scroll: several pages are thrown over the spine in quick succession, a few at a time
 *    in the air at once, so you see the pages riffle inside the book itself (no overlay).
 *
 * Tuning knobs are in TUNING below.
 */
const TUNING = {
  stepThresholdPx: 50, // wheel distance (px) that counts as one deliberate flip
  stepCooldownMs: 650, // lockout after a normal flip so trackpad inertia can't skip cards
  fastSpeedPx: 950, // wheel px travelled within `fastWindowMs` that counts as "fast"
  fastWindowMs: 300,
  fastStepEveryMs: 90, // while fast, advance again this often
  fastCardsPerStep: 2, // cards advanced per fast step
  fastHoldMs: 380, // keep riffle mode alive this long after the last fast event
  springNormal: 7,
  springFast: 13,
  riffleSpread: 1.9, // how many pages are in the air at once while riffling (1 = one at a time)
}

interface Props {
  projects: Project[]
  initialIndex?: number
  onOpen: (p: Project) => void
  paused?: boolean
}

function CardFace({ p, i }: { p: Project; i: number }) {
  return (
    <div className="card">
      <div className="card-img">
        <img src={artDataUrl(p.art, 960, 540)} alt={`${p.title} (sample artwork)`} draggable={false} />
        <span className="card-no">{String(i + 1).padStart(2, '0')}</span>
      </div>
      <div className="card-body">
        <div className="card-kicker">
          {p.kicker} · {p.year}
        </div>
        <h3>{p.title}</h3>
        <p>{p.blurb}</p>
        <div className="card-foot">
          <div className="tags">
            {p.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <span className="card-link">View →</span>
        </div>
      </div>
      <div className="shade" />
    </div>
  )
}

export default function FlipBook({ projects, initialIndex = 0, onOpen, paused }: Props) {
  const N = projects.length
  const [horizontal, setHorizontal] = useState(() => window.matchMedia('(max-width: 720px)').matches)
  const max = Math.max(0, N - (horizontal ? 1 : 2))
  const [target, setTarget] = useState(clamp(initialIndex, 0, max))
  const targetRef = useRef(target)
  const posRef = useRef(target)
  const spreadRef = useRef(1)
  const fastRef = useRef(false)
  const fastUntil = useRef(0)
  const pausedRef = useRef(!!paused)
  const bookRef = useRef<HTMLDivElement>(null)
  const swipeStart = useRef<{ x: number; y: number; time: number; pointerId: number } | null>(null)
  const suppressClick = useRef(false)
  const leaves = useRef<(HTMLDivElement | null)[]>([])
  const [fast, setFast] = useState(false)
  pausedRef.current = !!paused

  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)')
    const updateOrientation = () => setHorizontal(media.matches)
    updateOrientation()
    media.addEventListener('change', updateOrientation)
    return () => media.removeEventListener('change', updateOrientation)
  }, [])

  useEffect(() => {
    if (targetRef.current > max) {
      targetRef.current = max
      posRef.current = Math.min(posRef.current, max)
      setTarget(max)
    }
  }, [max])

  const step = useCallback(
    (delta: number) => {
      const nt = clamp(targetRef.current + delta, 0, max)
      if (nt !== targetRef.current) {
        targetRef.current = nt
        setTarget(nt)
      }
    },
    [max],
  )

  const layout = useCallback(
    (pos: number, W: number) => {
      for (let k = 0; k < N; k++) {
        const el = leaves.current[k]
        if (!el) continue
        if (horizontal) {
          const direction = targetRef.current === pos ? 0 : targetRef.current > pos ? 1 : -1
          const from = direction > 0 ? Math.floor(pos) : direction < 0 ? Math.ceil(pos) : Math.round(pos)
          const progress = direction === 0 ? 0 : direction > 0 ? pos - from : from - pos
          const incoming = from + direction
          const isCurrent = k === from
          const isIncoming = direction !== 0 && k === incoming

          if (!isCurrent && !isIncoming) {
            el.style.transform = 'rotateY(0deg)'
            el.style.opacity = '0'
            el.style.zIndex = '0'
            el.style.visibility = 'hidden'
            el.style.pointerEvents = 'none'
            el.dataset.slot = ''
            continue
          }

          const angle = isCurrent ? -direction * progress * 180 : direction * (1 - progress) * 180
          el.style.transform = `rotateY(${angle}deg)`
          el.style.opacity = '1'
          el.style.zIndex = isIncoming ? '2' : '1'
          el.style.visibility = 'visible'
          el.style.setProperty('--shade', (Math.sin(progress * Math.PI) * 0.4).toFixed(3))
          el.style.pointerEvents = direction === 0 && isCurrent ? 'auto' : 'none'
          el.dataset.slot = isCurrent ? 'current' : 'next'
          const face = el.firstElementChild as HTMLElement | null
          if (face) face.style.transform = Math.abs(angle) > 90 ? 'scaleX(-1)' : 'none'
          continue
        }

        const d = k - pos // 0 = top slot, 1 = bottom slot
        let tf = ''
        let op = 1
        let z = 0
        let u = 0 // 0 = flat in the bottom slot, 1 = fully turned into the top slot

        if (d >= 2) {
          op = 0
          tf = horizontal ? 'translate3d(26px,0,-60px)' : 'translate3d(0,26px,-60px)'
        } else if (d > 1) {
          const a = 2 - d // arriving into the next slot
          op = a
          tf = horizontal
            ? `translate3d(${(1 - a) * 26}px,0,${-60 * (1 - a)}px)`
            : `translate3d(0,${(1 - a) * 26}px,${-60 * (1 - a)}px)`
        } else {
          u = clamp((1 - d) / W, 0, 1)
          const th = u * 180
          const rotation = horizontal ? `rotateY(${th}deg)` : `rotateX(${th}deg)`
          if (d >= 0) {
            tf = rotation
          } else if (d > -1) {
            op = 1 + d
            tf = horizontal
              ? `translate3d(${d * 36}px,0,${d * 36}px) ${rotation}`
              : `translate3d(0,${d * 36}px,${d * 36}px) ${rotation}`
          } else {
            op = 0
            tf = horizontal ? `translate3d(-36px,0,-36px) ${rotation}` : `translate3d(0,-36px,-36px) ${rotation}`
          }
          z = u > 0 && u < 1 ? Math.round(10 + (1 - Math.abs(0.5 - u)) * 40 - Math.max(0, d) * 4) : 0
        }

        el.style.transform = tf
        el.style.opacity = String(op)
        el.style.zIndex = String(z)
        el.style.visibility = op <= 0.001 ? 'hidden' : 'visible'
        el.style.setProperty('--shade', (Math.sin(u * Math.PI) * 0.4).toFixed(3))
        const resting = Math.abs(d) < 0.02 || Math.abs(d - 1) < 0.02
        el.style.pointerEvents = resting ? 'auto' : 'none'
        el.dataset.slot = u > 0.5 ? 'current' : 'next'
        // past the half-way point the page is edge-on, so un-mirroring the face is invisible
        const face = el.firstElementChild as HTMLElement | null
        if (face) face.style.transform = u > 0.5 ? (horizontal ? 'scaleX(-1)' : 'scaleY(-1)') : 'none'
      }
    },
    [N, horizontal],
  )

  // animation loop: spring toward target, riffle spread, fast-mode expiry
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const k = fastRef.current ? TUNING.springFast : TUNING.springNormal
      posRef.current += (targetRef.current - posRef.current) * (1 - Math.exp(-k * dt))
      if (Math.abs(targetRef.current - posRef.current) < 0.0006) posRef.current = targetRef.current
      const wantW = fastRef.current ? TUNING.riffleSpread : 1
      spreadRef.current += (wantW - spreadRef.current) * (1 - Math.exp(-9 * dt))
      if (Math.abs(wantW - spreadRef.current) < 0.002) spreadRef.current = wantW
      layout(posRef.current, spreadRef.current)
      if (fastRef.current && now > fastUntil.current) {
        fastRef.current = false
        setFast(false)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [layout])

  // wheel, keyboard, touch
  useEffect(() => {
    const events: { t: number; d: number }[] = []
    let lastStep = 0
    let acc = 0
    let accT = 0

    const enterFast = (now: number) => {
      fastUntil.current = now + TUNING.fastHoldMs
      if (!fastRef.current) {
        fastRef.current = true
        setFast(true)
      }
    }

    const onWheel = (e: WheelEvent) => {
      if (pausedRef.current) return
      e.preventDefault()
      const now = performance.now()
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 600 : e.deltaY
      if (!dy) return
      events.push({ t: now, d: Math.abs(dy) })
      while (events.length && now - events[0].t > TUNING.fastWindowMs) events.shift()
      const speed = events.reduce((s, x) => s + x.d, 0)
      const dir = dy > 0 ? 1 : -1

      if (horizontal) {
        if (now - accT > 220) acc = 0
        accT = now
        acc += dy
        if (Math.abs(acc) >= TUNING.stepThresholdPx && now - lastStep > TUNING.stepCooldownMs) {
          lastStep = now
          acc = 0
          step(dir)
        }
        return
      }

      if (speed > TUNING.fastSpeedPx) {
        enterFast(now)
        if (now - lastStep > TUNING.fastStepEveryMs) {
          lastStep = now
          step(dir * TUNING.fastCardsPerStep)
        }
        return
      }
      if (fastRef.current) {
        // momentum tail of a fast scroll: keep riffling until it settles
        fastUntil.current = now + TUNING.fastHoldMs
        if (now - lastStep > TUNING.fastStepEveryMs * 2) {
          lastStep = now
          step(dir)
        }
        return
      }
      if (now - accT > 220) acc = 0
      accT = now
      acc += dy
      if (Math.abs(acc) >= TUNING.stepThresholdPx && now - lastStep > TUNING.stepCooldownMs) {
        lastStep = now
        acc = 0
        step(dir)
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (pausedRef.current) return
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault()
        step(1)
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        step(-1)
      } else if (e.key === 'Home') step(-N)
      else if (e.key === 'End') step(N)
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' || pausedRef.current) return
      suppressClick.current = false
      swipeStart.current = {
        x: e.clientX,
        y: e.clientY,
        time: performance.now(),
        pointerId: e.pointerId,
      }
    }
    const onPointerUp = (e: PointerEvent) => {
      const start = swipeStart.current
      if (!start || start.pointerId !== e.pointerId) return
      swipeStart.current = null
      if (pausedRef.current) return

      const dy = start.y - e.clientY
      const dx = start.x - e.clientX
      const dist = horizontal ? dx : dy
      if (Math.abs(dist) < 40) return
      suppressClick.current = true
      const speed = Math.abs(dist) / Math.max(1, performance.now() - start.time) // px per ms
      const dir = dist > 0 ? 1 : -1
      if (speed > 1.6) {
        const now = performance.now()
        enterFast(now)
        step(dir * Math.min(6, Math.round(speed * 2)))
      } else step(dir)
    }
    const onPointerCancel = (e: PointerEvent) => {
      if (swipeStart.current?.pointerId === e.pointerId) swipeStart.current = null
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    const book = bookRef.current
    book?.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerCancel)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      book?.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerCancel)
    }
  }, [step, N, horizontal])

  return (
    <div className="flip">
      <div
        ref={bookRef}
        className={`book${fast ? ' riffling' : ''}${horizontal ? ' horizontal' : ''}`}
        aria-label="Project flip book"
        onClickCapture={(e) => {
          if (!suppressClick.current) return
          e.preventDefault()
          e.stopPropagation()
          suppressClick.current = false
        }}
      >
        {projects.map((p, i) => (
          <div
            key={p.id}
            ref={(el) => {
              leaves.current[i] = el
            }}
            className="leaf"
            onClick={(e) => {
              const slot = (e.currentTarget as HTMLDivElement).dataset.slot
              if (slot === 'current' && i === targetRef.current) onOpen(p)
              else if (slot === 'next' && i === targetRef.current + 1) onOpen(p)
            }}
          >
            <div className="face">
              <CardFace p={p} i={i} />
            </div>
          </div>
        ))}
      </div>

      <div className="flip-ui">
        <button className="btn sm" onClick={() => step(-1)} disabled={target <= 0} aria-label="Previous">
          {horizontal ? '←' : '↑'}
        </button>
        <div className="flip-count">
          <b>{String(target + 1).padStart(2, '0')}</b>
          {!horizontal && <>–<b>{String(target + 2).padStart(2, '0')}</b></>}
          <span> / {String(N).padStart(2, '0')}</span>
        </div>
        <div className="ticks">
          {Array.from({ length: max + 1 }, (_, i) => (
            <button key={i} className={i === target ? 'on' : ''} onClick={() => step(i - target)} aria-label={`Go to cards ${i + 1} and ${i + 2}`} />
          ))}
        </div>
        <button className="btn sm" onClick={() => step(1)} disabled={target >= max} aria-label="Next">
          {horizontal ? '→' : '↓'}
        </button>
      </div>
      <p className="flip-hint">{horizontal ? 'Swipe left/right to flip · swipe fast to riffle' : 'Scroll to flip · scroll fast to riffle'}</p>
    </div>
  )
}
