import { useEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Edges, Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { clamp, damp, lerp, smooth } from '../lib/math'

/**
 * Landing scene. Three stages from the wireframe:
 *   0  axonometric, seen flat from above ("2D")
 *   1  isometric box with the projected plan on top ("3D")
 *   2  exploded view: floating slabs (DFI / College / North) + plan, click to open
 * `prog.v` is a continuous 0..2 value that eases toward the requested stage (~2s).
 */

type Prog = MutableRefObject<{ v: number }>
type Piece = { kind: 'box' | 'cyl' | 'cone' | 'sphere'; x: number; z: number; w: number; h: number; d: number; color: string }
interface SlabDef {
  id: string
  label: string
  center: [number, number, number]
  size: [number, number]
  explode: [number, number, number]
  phase: number
  pieces: Piece[]
}

const C = { tomato: '#ff4d2e', cobalt: '#2f4bff', sun: '#ffc531', mint: '#37d6a0', pink: '#ff94b8', ink: '#14120f' }

const SLABS: SlabDef[] = [
  {
    id: 'dfi', label: 'DFI', center: [-1.5, 0, 0], size: [3, 6], explode: [-2.6, 1.0, -0.2], phase: 0,
    pieces: [
      { kind: 'box', x: -0.6, z: -2.0, w: 1.2, h: 2.4, d: 1.2, color: C.tomato },
      { kind: 'box', x: 0.6, z: -0.8, w: 1.4, h: 0.9, d: 1.0, color: C.sun },
      { kind: 'cyl', x: -0.5, z: 0.5, w: 0.9, h: 1.7, d: 0.9, color: C.cobalt },
      { kind: 'box', x: 0.5, z: 1.7, w: 1.5, h: 3.0, d: 0.9, color: C.pink },
      { kind: 'cone', x: -0.7, z: 2.2, w: 0.8, h: 1.2, d: 0.8, color: C.mint },
    ],
  },
  {
    id: 'college', label: 'College', center: [1.5, 0, -1.5], size: [3, 3], explode: [2.0, 2.4, -2.4], phase: 2.1,
    pieces: [
      { kind: 'box', x: -0.7, z: -0.6, w: 1.2, h: 1.6, d: 1.2, color: C.cobalt },
      { kind: 'sphere', x: 0.6, z: -0.5, w: 1.0, h: 1.0, d: 1.0, color: C.tomato },
      { kind: 'box', x: 0.2, z: 0.8, w: 2.0, h: 0.6, d: 0.8, color: C.sun },
    ],
  },
  {
    id: 'north', label: 'North', center: [1.5, 0, 1.5], size: [3, 3], explode: [1.6, 0.3, 2.9], phase: 4.2,
    pieces: [
      { kind: 'box', x: -0.6, z: 0.5, w: 1.0, h: 2.2, d: 1.0, color: C.mint },
      { kind: 'box', x: 0.7, z: -0.5, w: 1.1, h: 1.2, d: 1.1, color: C.pink },
      { kind: 'cyl', x: 0.6, z: 0.8, w: 0.8, h: 0.8, d: 0.8, color: C.cobalt },
      { kind: 'cone', x: -0.6, z: -0.7, w: 0.9, h: 1.5, d: 0.9, color: C.sun },
    ],
  },
]

function makePlanTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 1024
  const g = c.getContext('2d')!
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 1024, 1024)
  g.lineJoin = 'round'
  g.lineCap = 'round'
  const rooms: [number, number, number, number, string][] = [
    [70, 70, 430, 300, '#ffffff'], [500, 70, 450, 190, '#ffe9a8'], [500, 260, 200, 250, '#ffffff'],
    [700, 260, 250, 250, '#ffd0c2'], [70, 370, 320, 580, '#cfe0ff'], [390, 510, 560, 440, '#ffffff'],
  ]
  g.strokeStyle = C.ink
  g.lineWidth = 8
  for (const [x, y, w, h, f] of rooms) {
    g.fillStyle = f
    g.fillRect(x, y, w, h)
    g.strokeRect(x, y, w, h)
  }
  g.lineWidth = 3
  for (let i = 0; i < 60; i++) {
    g.beginPath()
    g.moveTo(400 + i * 9, 515)
    g.lineTo(380 + i * 9, 940)
    g.globalAlpha = 0.18
    g.stroke()
  }
  g.globalAlpha = 1
  g.lineWidth = 4
  const doors: [number, number, number][] = [[300, 370, 0], [600, 260, 1], [390, 700, 2], [700, 400, 3]]
  for (const [x, y, q] of doors) {
    g.beginPath()
    g.arc(x, y, 60, (q * Math.PI) / 2, (q * Math.PI) / 2 + Math.PI / 2)
    g.stroke()
  }
  g.fillStyle = C.ink
  g.font = '700 38px "DM Mono", monospace'
  g.fillText('PROJECTED PLAN', 90, 1000)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function PieceMesh({ p }: { p: Piece }) {
  const geo =
    p.kind === 'box' ? <boxGeometry args={[p.w, p.h, p.d]} /> :
    p.kind === 'cyl' ? <cylinderGeometry args={[p.w / 2, p.w / 2, p.h, 28]} /> :
    p.kind === 'cone' ? <coneGeometry args={[p.w / 2, p.h, 28]} /> :
    <sphereGeometry args={[p.w / 2, 28, 20]} />
  return (
    <mesh position={[p.x, p.h / 2, p.z]} castShadow receiveShadow>
      {geo}
      <meshStandardMaterial color={p.color} roughness={0.55} />
      <Edges threshold={30} color={C.ink} />
    </mesh>
  )
}

function Slab({ def, prog, onSelect }: { def: SlabDef; prog: Prog; onSelect: (id: string) => void }) {
  const g = useRef<THREE.Group>(null)
  const pieces = useRef<THREE.Group>(null)
  const label = useRef<HTMLDivElement>(null)
  const hover = useRef(false)
  const hov = useRef(0)

  useFrame((st, dt) => {
    const t = prog.current.v
    const e = smooth(clamp(t - 1, 0, 1))
    const f = smooth(clamp(t * 1.5, 0, 1)) // 2D -> 3D growth, done by stage 1
    const bounce = e * Math.abs(Math.sin(st.clock.elapsedTime * 1.3 + def.phase)) * 0.35
    const grp = g.current!
    grp.position.set(
      def.center[0] + def.explode[0] * e,
      def.explode[1] * e + bounce,
      def.center[2] + def.explode[2] * e,
    )
    pieces.current!.scale.y = 0.03 + 0.97 * f
    hov.current = damp(hov.current, hover.current && t > 1.6 ? 1 : 0, 10, dt)
    grp.scale.setScalar(1 + 0.05 * hov.current)
    if (label.current) {
      label.current.style.opacity = String(e)
      label.current.dataset.hover = hov.current > 0.5 ? '1' : '0'
    }
  })

  return (
    <group
      ref={g}
      onPointerOver={(e) => {
        e.stopPropagation()
        hover.current = true
        if (prog.current.v > 1.6) document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        hover.current = false
        document.body.style.cursor = ''
      }}
      onClick={(e) => {
        e.stopPropagation()
        if (prog.current.v > 1.6) onSelect(def.id)
      }}
    >
      <mesh position={[0, -0.175, 0]} castShadow receiveShadow>
        <boxGeometry args={[def.size[0] - 0.03, 0.35, def.size[1] - 0.03]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.28} roughness={0.9} />
        <Edges threshold={15} color={C.ink} />
      </mesh>
      <group ref={pieces}>
        {def.pieces.map((p, i) => (
          <group key={i} position={[0, 0, 0]}>
            <PieceMesh p={p} />
          </group>
        ))}
      </group>
      <Html position={[0, 0.05, def.size[1] / 2 + 0.5]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={label} className="slab-label" style={{ opacity: 0 }}>
          <b>{def.label}</b>
          <span>Open →</span>
        </div>
      </Html>
    </group>
  )
}

function PlanSheet({ prog }: { prog: Prog }) {
  const mesh = useRef<THREE.Mesh>(null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  const tex = useMemo(() => makePlanTexture(), [])
  useFrame((st) => {
    const t = prog.current.v
    const s1 = smooth(clamp(t, 0, 1))
    const s2 = smooth(clamp(t - 1, 0, 1))
    const m = mesh.current!
    m.position.y = lerp(0.6, 4.7, s1) + s2 * (2.4 + Math.sin(st.clock.elapsedTime * 0.9) * 0.12)
    const k = lerp(1, 1.12, s2)
    m.scale.set(k, k, 1)
    mat.current!.opacity = clamp(s1 * 1.4, 0, 0.96)
    m.visible = s1 > 0.01
  })
  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[6.4, 6.4]} />
      <meshBasicMaterial ref={mat} map={tex} transparent depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

function IsoBox({ prog }: { prog: Prog }) {
  const grp = useRef<THREE.Group>(null)
  const line = useRef<any>(null)
  const pts = useMemo(() => {
    const H = 4.7
    const a = 3.2
    const b: [number, number, number][] = [[-a, 0, -a], [a, 0, -a], [a, 0, a], [-a, 0, a]]
    const t: [number, number, number][] = b.map(([x, , z]) => [x, H, z])
    const out: [number, number, number][] = []
    for (let i = 0; i < 4; i++) {
      out.push(b[i], b[(i + 1) % 4], t[i], t[(i + 1) % 4], b[i], t[i])
    }
    return out
  }, [])
  useFrame(() => {
    const t = prog.current.v
    const s1 = smooth(clamp(t, 0, 1))
    const s2 = smooth(clamp(t - 1, 0, 1))
    grp.current!.scale.y = Math.max(0.001, s1)
    grp.current!.visible = s1 > 0.01 && s2 < 0.98
    if (line.current) line.current.material.opacity = (1 - s2) * 0.9
  })
  return (
    <group ref={grp}>
      <Line ref={line} segments points={pts} color={C.ink} lineWidth={1.4} dashed dashSize={0.22} gapSize={0.16} transparent />
    </group>
  )
}

function Rig({ prog }: { prog: Prog }) {
  const { camera, size } = useThree()
  useFrame((st) => {
    const t = prog.current.v
    const s1 = smooth(clamp(t, 0, 1))
    const s2 = smooth(clamp(t - 1, 0, 1))
    const elev = (lerp(88, 35.264, s1) * Math.PI) / 180
    const az =
      (lerp(0, 45, s1) * Math.PI) / 180 +
      st.pointer.x * 0.2 * (0.25 + 0.75 * s1) +
      s2 * Math.sin(st.clock.elapsedTime * 0.25) * 0.12
    const ty = lerp(0, lerp(2.2, 3.3, s2), s1)
    const r = 40
    camera.position.set(r * Math.cos(elev) * Math.sin(az), ty + r * Math.sin(elev), r * Math.cos(elev) * Math.cos(az))
    camera.lookAt(0, ty, 0)
    const unit = Math.min(size.width / 13, size.height / 10.5)
    const cam = camera as THREE.OrthographicCamera
    cam.zoom = unit * lerp(1.15, 1.0, s1) * lerp(1, 0.8, s2)
    cam.updateProjectionMatrix()
  })
  return null
}

function Director({ stage, prog }: { stage: number; prog: Prog }) {
  useFrame((_, dt) => {
    prog.current.v = damp(prog.current.v, stage, 2.4, Math.min(dt, 0.05))
    if (Math.abs(prog.current.v - stage) < 0.001) prog.current.v = stage
  })
  return null
}

export default function HeroScene({ stage, onSelect }: { stage: number; onSelect: (id: string) => void }) {
  const prog = useRef({ v: 0 })
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(true)
    return () => {
      document.body.style.cursor = ''
    }
  }, [])
  return (
    <Canvas
      className={ready ? 'hero-canvas ready' : 'hero-canvas'}
      orthographic
      shadows
      dpr={[1, 2]}
      camera={{ zoom: 80, position: [20, 20, 20], near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Director stage={stage} prog={prog} />
      <Rig prog={prog} />
      <ambientLight intensity={1.0} />
      <hemisphereLight args={['#ffffff', '#e9e3d6', 0.5]} />
      <directionalLight
        position={[8, 16, 6]}
        intensity={1.7}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0005}
      />
      <mesh rotation-x={-Math.PI / 2} position-y={-0.45} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial opacity={0.14} />
      </mesh>
      {SLABS.map((s) => (
        <Slab key={s.id} def={s} prog={prog} onSelect={onSelect} />
      ))}
      <IsoBox prog={prog} />
      <PlanSheet prog={prog} />
    </Canvas>
  )
}
