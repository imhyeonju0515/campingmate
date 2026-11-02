import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// ── 좌표 변환 ────────────────────────────────────────────
// 1 장면 단위 = 6km. 북쪽이 -z, 동쪽이 +x. (위도 1° ≈ 111km, 경도 1° ≈ 93km @ 제주)
const K = 6
const CENTER = { lat: 33.385, lng: 126.56 }
const toXZ = (lat, lng) => [((lng - CENTER.lng) * 93) / K, ((CENTER.lat - lat) * 111) / K]
const GROUND = 0.22                          // 섬 윗면 높이

// 한라산 높이 프로필 (가우시안 산) — 모델링과 핀 높이 계산이 같은 식을 씁니다
const HALLA = { pos: toXZ(33.362, 126.53), h: 1.6, sigma: 0.85 }
const hallaH = (r) => HALLA.h * Math.exp(-(r * r) / (2 * HALLA.sigma ** 2))
const heightAt = (x, z) => hallaH(Math.hypot(x - HALLA.pos[0], z - HALLA.pos[1]))

const FIT_COLOR = { good: '#2e9e5b', caution: '#f0ad00', avoid: '#d9534f', none: '#6c757d' }
const TAG_COLOR = { myth: '#8e44ad', oreum: '#198754', volcano: '#c0392b' }

// 시드가 고정된 난수 — 오름 배치가 새로고침해도 같게
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const RX = 6.2, RY = 3.1                      // 섬의 동서·남북 반지름 (장면 단위)
const radius = (th) => 1 + 0.04 * Math.sin(3 * th + 1) + 0.03 * Math.sin(5 * th)   // 해안선 굴곡

// ── 섬 ──────────────────────────────────────────────────
function Island() {
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    for (let i = 0; i <= 96; i++) {
      const th = (i / 96) * Math.PI * 2
      const x = RX * radius(th) * Math.cos(th), y = RY * radius(th) * Math.sin(th)
      i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)
    }
    return s
  }, [])
  const halla = useMemo(() => {
    const pts = []
    // 면 방향이 어느 쪽이든 DoubleSide 로 그려 음영이 맞도록 합니다
    for (let r = 2.5; r >= 0.001; r -= 0.1) pts.push(new THREE.Vector2(r, hallaH(r)))   // 폭 2.5 에서 높이가 거의 0
    const g = new THREE.LatheGeometry(pts, 40)
    g.computeVertexNormals()                  // 면 방향 기준으로 법선을 다시 계산 (음영이 뒤집히는 것 방지)
    return g
  }, [])
  const oreums = useMemo(() => {
    const rnd = mulberry32(368)               // 오름 368개의 전설을 떠올리며 시드 368
    const out = []
    while (out.length < 40) {
      const th = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 0.88
      const x = RX * rr * Math.cos(th), z = RY * rr * Math.sin(th)
      if (Math.hypot(x - HALLA.pos[0], z - HALLA.pos[1]) < 1.4) continue   // 한라산 정상부 제외
      out.push({ x, z, r: 0.14 + rnd() * 0.16, h: 0.1 + rnd() * 0.2 })
    }
    return out
  }, [])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND - 0.4, 0]}>
        <extrudeGeometry args={[shape, { depth: 0.4, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.04, bevelSegments: 2 }]} />
        <meshStandardMaterial color="#86a86a" flatShading />
      </mesh>
      {/* 한라산 */}
      <mesh position={[HALLA.pos[0], GROUND + 0.004, HALLA.pos[1]]}>
        <primitive object={halla} attach="geometry" />
        <meshStandardMaterial color="#7a9a5c" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[HALLA.pos[0], GROUND + HALLA.h - 0.05, HALLA.pos[1]]}>
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshStandardMaterial color="#8a7b6a" flatShading />
      </mesh>
      {/* 오름들 */}
      {oreums.map((o, i) => (
        <mesh key={i} position={[o.x, GROUND + o.h / 2, o.z]}>
          <coneGeometry args={[o.r, o.h, 12]} />
          <meshStandardMaterial color="#7a9a5c" flatShading />
        </mesh>
      ))}
    </group>
  )
}

// ── 핀 ──────────────────────────────────────────────────
function Pin({ lat, lng, color, label, selected, bob = false, onClick, children }) {
  const [x, z] = toXZ(lat, lng)
  const y = GROUND + heightAt(x, z)
  const [hover, setHover] = useState(false)
  const ref = useRef()
  const phase = useMemo(() => (x + z) * 3, [x, z])
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = y + 0.15 + (bob ? Math.sin(clock.elapsedTime * 2 + phase) * 0.04 : 0)
  })
  return (
    <group ref={ref} position={[x, y + 0.15, z]} scale={hover || selected ? 1.35 : 1}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = '' }}>
      {children(color)}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
          <ringGeometry args={[0.28, 0.34, 32]} />
          <meshBasicMaterial color="#212529" />
        </mesh>
      )}
      {(hover || selected) && (
        <Html center position={[0, 0.5, 0]} style={{ pointerEvents: 'none' }}>
          <span className="badge text-bg-dark text-nowrap">{label}</span>
        </Html>
      )}
    </group>
  )
}

// 캠핑장 = 텐트 모양 (4각뿔)
const Tent = (color) => (
  <mesh rotation={[0, Math.PI / 4, 0]}>
    <coneGeometry args={[0.2, 0.38, 4]} />
    <meshStandardMaterial color={color} />
  </mesh>
)
// 이야기 스팟 = 빛나는 구슬
const Orb = (color) => (
  <mesh>
    <sphereGeometry args={[0.11, 16, 16]} />
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
  </mesh>
)

// ── 바람 줄기 ────────────────────────────────────────────
// ms = 풍속(m/s), vec = 풍향(바람이 "불어오는" 방향, 도). 줄기는 불어 가는 방향으로 흐릅니다.
function WindField({ ms, vec }) {
  const N = 220
  const ref = useRef()
  const pos = useMemo(() => {
    const rnd = mulberry32(7)
    const p = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) { p[i * 3] = (rnd() - 0.5) * 15; p[i * 3 + 1] = 0.4 + rnd() * 1.0; p[i * 3 + 2] = (rnd() - 0.5) * 9 }
    return p
  }, [])
  const lines = useMemo(() => new Float32Array(N * 6), [])
  const to = ((vec + 180) * Math.PI) / 180
  const dx = Math.sin(to), dz = -Math.cos(to)

  useFrame((_, dt) => {
    const speed = ms * 0.35, len = Math.min(0.15 + ms * 0.07, 1.1)
    for (let i = 0; i < N; i++) {
      let x = pos[i * 3] + dx * speed * dt, z = pos[i * 3 + 2] + dz * speed * dt
      if (x > 7.5) x -= 15; else if (x < -7.5) x += 15
      if (z > 4.5) z -= 9; else if (z < -4.5) z += 9
      pos[i * 3] = x; pos[i * 3 + 2] = z
      const y = pos[i * 3 + 1]
      lines.set([x, y, z, x - dx * len, y, z - dz * len], i * 6)
    }
    if (ref.current) ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <lineSegments ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[lines, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#0aa2c0" transparent opacity={0.65} />
    </lineSegments>
  )
}

// ── 장면 ────────────────────────────────────────────────
// camps: [{ id, name, lat, lng, fit }]  stories: [{ id, name, lat, lng, tag, stamped }]
// wind: { ms, vec } | null   selected: { kind, id } | null   onPick({ kind, id }) | onPick(null)
export default function Jeju3D({ camps = [], stories = [], wind = null, showCamps = true, showStories = true, selected = null, onPick, height = 480 }) {
  return (
    <Canvas camera={{ position: [0, 6.5, 12], fov: 45 }} dpr={[1, 2]} style={{ height, background: '#dbeef5' }}
      onPointerMissed={() => onPick?.(null)}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[-6, 6, 6]} intensity={1.3} />

      {/* 바다 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[14, 64]} />
        <meshStandardMaterial color="#8cc8e0" />
      </mesh>
      <Island />
      <Html position={[0, 0.1, -4.6]} center style={{ pointerEvents: 'none' }}><span className="badge text-bg-secondary">N ↑</span></Html>

      {wind?.ms > 0 && Number.isFinite(wind.vec) && <WindField ms={wind.ms} vec={wind.vec} />}

      {showCamps && camps.map((c) => (
        <Pin key={c.id} lat={c.lat} lng={c.lng} label={c.name} color={FIT_COLOR[c.fit ?? 'none']}
          selected={selected?.kind === 'camp' && selected.id === c.id} onClick={() => onPick?.({ kind: 'camp', id: c.id })}>
          {Tent}
        </Pin>
      ))}
      {showStories && stories.map((s) => (
        <Pin key={s.id} lat={s.lat} lng={s.lng} label={s.name} bob color={s.stamped ? '#ffc107' : TAG_COLOR[s.tag]}
          selected={selected?.kind === 'story' && selected.id === s.id} onClick={() => onPick?.({ kind: 'story', id: s.id })}>
          {Orb}
        </Pin>
      ))}

      <OrbitControls enablePan={false} minDistance={6} maxDistance={22} maxPolarAngle={Math.PI / 2.15} />
    </Canvas>
  )
}
