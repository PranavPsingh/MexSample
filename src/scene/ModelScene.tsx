import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Edges, Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { projects } from '../data/projects'
import type { Project } from '../data/projects'
import { makeArtCanvas } from '../lib/art'
import { clamp, damp } from '../lib/math'

/** Wireframe "Option 2": a white slab with the projects standing on it as planes. */

function Plane({ p, i, onSelect }: { p: Project; i: number; onSelect: (id: string) => void }) {
  const g = useRef<THREE.Group>(null)
  const hover = useRef(false)
  const [hot, setHot] = useState(false)
  const lift = useRef(0)
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(makeArtCanvas(p.art, 512, 640))
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [p])
  const col = i % 3
  const row = Math.floor(i / 3)
  const x = (col - 1) * 2.9
  const z = (row - 1) * 2.0
  const rot = (i % 2 === 0 ? 1 : -1) * 0.55 + (row - 1) * 0.12

  useFrame((st, dt) => {
    lift.current = damp(lift.current, hover.current ? 1 : 0, 10, dt)
    const bob = Math.sin(st.clock.elapsedTime * 1.1 + i) * 0.03
    g.current!.position.y = 1.15 + lift.current * 0.3 + bob
    g.current!.scale.setScalar(1 + lift.current * 0.06)
  })

  return (
    <group position={[x, 0, z]} rotation-y={rot}>
      <group
        ref={g}
        onPointerOver={(e) => {
          e.stopPropagation()
          hover.current = true
          setHot(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          hover.current = false
          setHot(false)
          document.body.style.cursor = ''
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (e.delta > 4) return
          onSelect(p.id)
        }}
      >
        <mesh castShadow>
          <boxGeometry args={[1.7, 2.1, 0.06]} />
          <meshStandardMaterial map={tex} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.55} roughness={0.8} />
          <Edges color="#14120f" threshold={15} />
        </mesh>
        {hot && (
          <Html position={[0, -1.35, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
            <div className="plane-label">{p.title}</div>
          </Html>
        )}
      </group>
    </group>
  )
}

function Fit() {
  const { camera, size } = useThree()
  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera
    cam.zoom = Math.min(size.width / 13.5, size.height / 8.5)
    cam.updateProjectionMatrix()
  }, [camera, size])
  return null
}

function MouseFollowCamera() {
  const { camera } = useThree()
  const pointer = useRef({ x: 0, y: 0 })
  const position = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = 1 - (event.clientY / window.innerHeight) * 2
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  useFrame((_, dt) => {
    position.current.x = damp(position.current.x, pointer.current.x, 4, dt)
    position.current.y = damp(position.current.y, pointer.current.y, 4, dt)

    const targetY = 0.8
    const radius = 19.8
    const azimuth = Math.PI / 4 + position.current.x * 0.58
    const polar = clamp(1.02 - position.current.y * 0.22, 0.62, 1.35)
    camera.position.set(
      radius * Math.sin(polar) * Math.sin(azimuth),
      targetY + radius * Math.cos(polar),
      radius * Math.sin(polar) * Math.cos(azimuth),
    )
    camera.lookAt(0, targetY, 0)
  })

  return null
}

export default function ModelScene({ onSelect }: { onSelect: (id: string) => void }) {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 720px)').matches)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)')
    const updateMobile = () => setMobile(media.matches)
    updateMobile()
    media.addEventListener('change', updateMobile)
    return () => media.removeEventListener('change', updateMobile)
  }, [])

  return (
    <Canvas
      className="hero-canvas ready"
      orthographic
      shadows
      dpr={[1, 2]}
      camera={{ zoom: 70, position: [12, 11, 12], near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Fit />
      {!mobile && <MouseFollowCamera />}
      <ambientLight intensity={1.0} />
      <hemisphereLight args={['#ffffff', '#e9e3d6', 0.5]} />
      <directionalLight
        position={[7, 14, 5]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <mesh position={[0, -0.25, 0]} receiveShadow castShadow>
        <boxGeometry args={[10.2, 0.5, 7.4]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.28} roughness={0.9} />
        <Edges color="#14120f" threshold={15} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.52} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial opacity={0.14} />
      </mesh>
      {projects.map((p, i) => (
        <Plane key={p.id} p={p} i={i} onSelect={onSelect} />
      ))}
      <OrbitControls
        makeDefault
        enabled={mobile}
        enableRotate={mobile}
        enableDamping
        enablePan={false}
        enableZoom={false}
        minPolarAngle={0.55}
        maxPolarAngle={1.25}
        target={[0, 0.8, 0]}
      />
    </Canvas>
  )
}
