import { useEffect, useRef } from 'react'

/** Hidden SVG filter; hand-drawn "boiling" outlines. Used by the .boil class in CSS. */
export default function BoilFilter() {
  const turb = useRef<SVGFETurbulenceElement>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let s = 1
    const id = window.setInterval(() => {
      s = (s % 5) + 1
      turb.current?.setAttribute('seed', String(s))
    }, 130)
    return () => window.clearInterval(id)
  }, [])
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden focusable="false">
      <filter id="boil" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence ref={turb} type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="1" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3" />
      </filter>
    </svg>
  )
}
