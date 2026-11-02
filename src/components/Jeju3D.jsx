import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Html, OrbitControls, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

// ── 로우폴리 디오라마 ─────────────────────────────────────
// 작은 받침대 위에 놓인 파스텔 톤 제주 미니어처. 모든 지형은 코드로 만든 삼각형(외부 모델 없음)이고,
// 해안선은 제주 해안 주요 지점을 이어 만든 "근사치"입니다 (정확한 지형 데이터가 아님).

// 1 장면 단위 = 6km. 북쪽이 -z, 동쪽이 +x. (위도 1° ≈ 111km, 경도 1° ≈ 93km @ 제주)
const K = 6
const CENTER = { lat: 33.385, lng: 126.56 }
const toXZ = (lat, lng) => [((lng - CENTER.lng) * 93) / K, ((CENTER.lat - lat) * 111) / K]
const SEA = -0.37                                   // 바다 높이
const HALF_X = 8, HALF_Z = 5                        // 받침대 반폭 (16 x 10)

// 제주 해안 근사 (시계 방향, 제주항에서 시작) — [위도, 경도]
const COAST = [
  [33.525, 126.53], [33.545, 126.64], [33.560, 126.75], [33.535, 126.85], [33.505, 126.93], [33.465, 126.945],
  [33.430, 126.92], [33.320, 126.84], [33.270, 126.72], [33.255, 126.62], [33.240, 126.56], [33.245, 126.41],
  [33.232, 126.34], [33.215, 126.30], [33.205, 126.265], [33.222, 126.19], [33.295, 126.165], [33.395, 126.235],
  [33.420, 126.265], [33.470, 126.315], [33.510, 126.45],
].map(([la, lo]) => toXZ(la, lo))

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 해안선까지의 부호 있는 거리 (안쪽 +, 바깥 -)
function coastDist(x, z) {
  let inside = false, dmin = Infinity
  for (let i = 0, j = COAST.length - 1; i < COAST.length; j = i++) {
    const [ax, az] = COAST[i], [bx, bz] = COAST[j]
    if ((az > z) !== (bz > z) && x < ((bx - ax) * (z - az)) / (bz - az) + ax) inside = !inside
    const dx = bx - ax, dz = bz - az
    const t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)))
    dmin = Math.min(dmin, Math.hypot(x - (ax + t * dx), z - (az + t * dz)))
  }
  return inside ? dmin : -dmin
}

// 한라산(동서로 긴 산)과 오름 40개 — 오름 368개의 전설을 떠올리며 시드 368
const HALLA = { pos: toXZ(33.362, 126.53), h: 1.7, sx: 1.25, sz: 0.85 }
const OREUMS = (() => {
  const rnd = mulberry32(368), out = []
  while (out.length < 40) {
    const x = (rnd() - 0.5) * 13, z = (rnd() - 0.5) * 6
    if (coastDist(x, z) < 0.5 || Math.hypot(x - HALLA.pos[0], (z - HALLA.pos[1]) * 1.4) < 1.8) continue
    out.push({ x, z, s: 0.22 + rnd() * 0.18, h: 0.12 + rnd() * 0.2 })
  }
  return out
})()

// 위치 → { h: 높이, d: 해안선 거리 }
function terrain(x, z) {
  const d = coastDist(x, z)
  if (d < 0) return { h: 0.03 - smooth(0, 0.5, -d) * (0.03 - SEA), d }          // 바다: 해안에서 완만하게 깊어짐
  const c = smooth(0, 0.9, d)
  let h = 0.03 + 0.26 * c + 0.05 * c * Math.sin(x * 1.7) * Math.cos(z * 1.3)
  const dx = x - HALLA.pos[0], dz = z - HALLA.pos[1]
  h += HALLA.h * Math.exp(-(dx * dx) / (2 * HALLA.sx ** 2) - (dz * dz) / (2 * HALLA.sz ** 2)) * c
  for (const o of OREUMS) h += o.h * Math.exp(-((x - o.x) ** 2 + (z - o.z) ** 2) / (2 * o.s ** 2)) * c
  return { h, d }
}

// ── 색 (파스텔) ──────────────────────────────────────────
const C = (hex) => new THREE.Color(hex)
const LAND = [[0.07, C('#f2e6b8')], [0.4, C('#b5da95')], [0.8, C('#8cc98a')], [1.2, C('#6db37a')], [1.55, C('#bcae9c')], [9, C('#f6f2ea')]]
const SHALLOW = C('#a8eadc'), MID = C('#7ed0e4'), DEEP = C('#58a8d8')

function colorAt(h, d, jitter) {
  const col = new THREE.Color()
  if (d < 0) {
    const t = smooth(0, 1.0, -d)
    col.copy(SHALLOW).lerp(MID, Math.min(1, t * 2)).lerp(DEEP, Math.max(0, t * 2 - 1))
  } else {
    const i = LAND.findIndex(([max]) => h < max)
    col.copy(LAND[i][1])
  }
  return col.offsetHSL(0, 0, jitter)           // 면마다 살짝 다른 밝기로 로우폴리 느낌
}

// ── 지형 메쉬: 격자를 삼각형 면으로 쪼개고 면마다 색을 칠함 ─────────
function Terrain() {
  const geometry = useMemo(() => {
    const NX = 100, NZ = 62
    const xs = [], zs = []
    for (let i = 0; i <= NX; i++) xs.push(-HALF_X + (i / NX) * HALF_X * 2)
    for (let j = 0; j <= NZ; j++) zs.push(-HALF_Z + (j / NZ) * HALF_Z * 2)
    const V = xs.map((x) => zs.map((z) => terrain(x, z)))
    const pos = [], col = []
    const rnd = mulberry32(11)
    const tri = (a, b, c) => {
      const h = (a.h + b.h + c.h) / 3, d = (a.d + b.d + c.d) / 3
      const color = colorAt(h, d, (rnd() - 0.5) * 0.05)
      for (const p of [a, b, c]) { pos.push(p.x, p.h, p.z); col.push(color.r, color.g, color.b) }
    }
    for (let i = 0; i < NX; i++) {
      for (let j = 0; j < NZ; j++) {
        const p = (ii, jj) => ({ x: xs[ii], z: zs[jj], ...V[ii][jj] })
        const a = p(i, j), b = p(i + 1, j), c = p(i, j + 1), e = p(i + 1, j + 1)
        // 대각선 방향을 번갈아 써서 규칙적인 줄무늬를 줄임
        if ((i + j) % 2) { tri(a, c, b); tri(b, c, e) } else { tri(a, c, e); tri(a, e, b) }
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
    g.computeVertexNormals()                   // 비색인 메쉬라 면 법선(평면 음영)이 됨
    return g
  }, [])

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.95} />
    </mesh>
  )
}

// ── 받침대 ──────────────────────────────────────────────
function Plinth() {
  return (
    <>
      <RoundedBox args={[HALF_X * 2 + 0.04, 0.9, HALF_Z * 2 + 0.04]} radius={0.1} smoothness={3} position={[0, SEA - 0.455, 0]} receiveShadow>
        <meshStandardMaterial color="#fbf4e4" roughness={0.9} />
      </RoundedBox>
      <ContactShadows position={[0, SEA - 0.92, 0]} opacity={0.28} scale={26} blur={2.6} far={2.5} />
    </>
  )
}

// ── 구름: 바람 방향으로 천천히 흘러감 ───────────────────────
function Clouds({ dx, dz, ms }) {
  const refs = useRef([])
  const clouds = useMemo(() => {
    const rnd = mulberry32(5)
    return Array.from({ length: 6 }, () => ({
      x: (rnd() - 0.5) * 16, y: 2.3 + rnd() * 0.9, z: (rnd() - 0.5) * 10, s: 0.7 + rnd() * 0.6,
      puffs: Array.from({ length: 4 }, (_, k) => [(k - 1.5) * 0.45, (rnd() - 0.5) * 0.15, (rnd() - 0.5) * 0.3, 0.3 + rnd() * 0.18]),
    }))
  }, [])
  useFrame((_, dt) => {
    const speed = 0.18 + ms * 0.09
    refs.current.forEach((g) => {
      if (!g) return
      g.position.x += dx * speed * dt; g.position.z += dz * speed * dt
      if (g.position.x > 9) g.position.x -= 18; else if (g.position.x < -9) g.position.x += 18
      if (g.position.z > 6) g.position.z -= 12; else if (g.position.z < -6) g.position.z += 12
    })
  })
  return clouds.map((c, i) => (
    <group key={i} ref={(el) => (refs.current[i] = el)} position={[c.x, c.y, c.z]} scale={c.s}>
      {c.puffs.map(([x, y, z, r], k) => (
        <mesh key={k} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.45} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  ))
}

// ── 바람 줄기 ────────────────────────────────────────────
// ms = 풍속(m/s). dx,dz = 불어 가는 방향(단위벡터). 줄기는 그 방향으로 흐릅니다.
function WindField({ ms, dx, dz }) {
  const N = 200
  const ref = useRef()
  const pos = useMemo(() => {
    const rnd = mulberry32(7), p = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) { p[i * 3] = (rnd() - 0.5) * 16; p[i * 3 + 1] = 0.5 + rnd() * 1.4; p[i * 3 + 2] = (rnd() - 0.5) * 10 }
    return p
  }, [])
  const lines = useMemo(() => new Float32Array(N * 6), [])
  useFrame((_, dt) => {
    const speed = ms * 0.35, len = Math.min(0.2 + ms * 0.08, 1.2)
    for (let i = 0; i < N; i++) {
      let x = pos[i * 3] + dx * speed * dt, z = pos[i * 3 + 2] + dz * speed * dt
      if (x > 8) x -= 16; else if (x < -8) x += 16
      if (z > 5) z -= 10; else if (z < -5) z += 10
      pos[i * 3] = x; pos[i * 3 + 2] = z
      const y = pos[i * 3 + 1]
      lines.set([x, y, z, x - dx * len, y, z - dz * len], i * 6)
    }
    if (ref.current) ref.current.geometry.attributes.position.needsUpdate = true
  })
  return (
    <lineSegments ref={ref} frustumCulled={false}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[lines, 3]} /></bufferGeometry>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.85} />
    </lineSegments>
  )
}

// ── 핀 ──────────────────────────────────────────────────
const FIT_COLOR = { good: '#34c27a', caution: '#ffb627', avoid: '#f25f5c', none: '#9aa5b1' }
const TAG_COLOR = { myth: '#9b6bd8', oreum: '#3fb37f', volcano: '#ef6f4f' }
const groundY = (x, z) => Math.max(terrain(x, z).h, 0.03)

const labelStyle = {
  pointerEvents: 'none', background: '#fff', color: '#2b2b2b', padding: '3px 10px', borderRadius: 999,
  fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgb(0 0 0 / .18)',
}

function Pin({ lat, lng, label, selected, bob, onClick, children }) {
  const [x, z] = useMemo(() => toXZ(lat, lng), [lat, lng])
  const y = useMemo(() => groundY(x, z), [x, z])
  const [hover, setHover] = useState(false)
  const ref = useRef(), ring = useRef()
  const phase = useMemo(() => (x + z) * 3, [x, z])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (ref.current) {
      ref.current.position.y = y + (bob ? 0.32 + Math.sin(t * 2 + phase) * 0.05 : 0.02)
      ref.current.rotation.y = bob ? t * 0.8 : 0
    }
    if (ring.current) ring.current.scale.setScalar(1 + Math.sin(t * 4) * 0.08)
  })
  const s = (hover || selected ? 1.3 : 1) * 0.72   // 핀이 너무 크면 지도가 빽빽해 보여 줄임
  return (
    <group position={[x, 0, z]}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = '' }}>
      {/* 바닥 그림자 점 */}
      <mesh position={[0, y + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 20]} /><meshBasicMaterial color="#1f3a2c" transparent opacity={0.28} />
      </mesh>
      <group ref={ref} scale={s}>{children}</group>
      {selected && (
        <mesh ref={ring} position={[0, y + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.32, 0.4, 40]} /><meshBasicMaterial color="#ffffff" />
        </mesh>
      )}
      {(hover || selected) && (
        <Html center position={[0, y + 0.95, 0]} zIndexRange={[20, 0]}><span style={labelStyle}>{label}</span></Html>
      )}
    </group>
  )
}

const Tent = ({ color }) => (
  <group position={[0, 0.2, 0]}>
    <mesh castShadow rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[0.25, 0.42, 4]} /><meshStandardMaterial color={color} flatShading roughness={0.7} />
    </mesh>
    <mesh position={[0, -0.02, 0.1]} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[0.1, 0.2, 4]} /><meshStandardMaterial color="#fff7e6" flatShading />
    </mesh>
  </group>
)
const Orb = ({ color, stamped }) => (
  <group>
    <mesh castShadow>
      <icosahedronGeometry args={[0.13, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={stamped ? 0.9 : 0.35} flatShading roughness={0.4} />
    </mesh>
    {stamped && (
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.2, 0.018, 8, 32]} /><meshBasicMaterial color="#fff3b0" /></mesh>
    )}
  </group>
)

// ── 카메라: 처음엔 멀리서 다가오고, 핀을 고르면 그 핀으로 부드럽게 이동 ──
function Rig({ controls, focus, focusKey }) {
  const camera = useThree((s) => s.camera)
  const st = useRef({ active: true, t: 0 })
  useEffect(() => { st.current = { active: true, t: 0 } }, [focusKey])
  useEffect(() => {
    const c = controls.current
    if (!c) return
    const stop = () => { st.current.active = false }          // 사용자가 직접 돌리면 자동 이동 중단
    c.addEventListener('start', stop)
    return () => c.removeEventListener('start', stop)
  }, [controls])
  useFrame((_, dt) => {
    const c = controls.current, s = st.current
    if (!c || !s.active) return
    s.t += dt
    if (s.t > 1.8) { s.active = false; return }
    const k = 1 - Math.pow(0.002, dt)
    const goal = focus ? new THREE.Vector3(...focus) : new THREE.Vector3(0, 0, 0)
    c.target.lerp(goal, k)
    const dir = camera.position.clone().sub(c.target)
    const len = THREE.MathUtils.lerp(dir.length(), focus ? 5.2 : 13.5, k)
    camera.position.copy(c.target).add(dir.normalize().multiplyScalar(len))
    c.update()
  })
  return null
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']

// ── 장면 ────────────────────────────────────────────────
// camps: [{ id, name, lat, lng, fit }]  stories: [{ id, name, lat, lng, tag, stamped }]
// wind: { ms, vec } | null (vec = 바람이 "불어오는" 방향, 도)   selected: { kind, id } | null
export default function Jeju3D({ camps = [], stories = [], wind = null, showCamps = true, showStories = true, selected = null, onPick, height = 480 }) {
  const controls = useRef()
  const hasWind = wind?.ms > 0 && Number.isFinite(wind.vec)
  const to = hasWind ? ((wind.vec + 180) * Math.PI) / 180 : (90 * Math.PI) / 180     // 바람 없으면 구름은 서→동으로 느리게
  const dx = Math.sin(to), dz = -Math.cos(to)

  const picked = selected && (selected.kind === 'camp' ? camps : stories).find((p) => p.id === selected.id)
  const focus = useMemo(() => {
    if (!picked) return null
    const [x, z] = toXZ(picked.lat, picked.lng)
    return [x, groundY(x, z), z]
  }, [picked?.id, picked?.lat, picked?.lng])   // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'relative', height, background: 'linear-gradient(180deg,#fdf6e3 0%,#e6f3f1 100%)' }}>
      <Canvas shadows camera={{ position: [0, 11, 21], fov: 40 }} dpr={[1, 2]} gl={{ alpha: true }}
        onPointerMissed={() => onPick?.(null)}>
        <hemisphereLight args={['#fff6e0', '#bfe3ee', 0.85]} />
        <directionalLight position={[-7, 9, 6]} intensity={1.5} color="#fff1d6" castShadow
          shadow-mapSize={[2048, 2048]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={8} shadow-camera-bottom={-8}
          shadow-bias={-0.0004} shadow-normalBias={0.03} />

        <Plinth />
        <Terrain />
        <Clouds dx={dx} dz={dz} ms={hasWind ? wind.ms : 0} />
        {hasWind && <WindField ms={wind.ms} dx={dx} dz={dz} />}
        <Html position={[0, 0.1, -4.4]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}><span style={labelStyle}>N ↑</span></Html>

        {showCamps && camps.map((c) => (
          <Pin key={c.id} lat={c.lat} lng={c.lng} label={c.name}
            selected={selected?.kind === 'camp' && selected.id === c.id} onClick={() => onPick?.({ kind: 'camp', id: c.id })}>
            <Tent color={FIT_COLOR[c.fit ?? 'none']} />
          </Pin>
        ))}
        {showStories && stories.map((s) => (
          <Pin key={s.id} lat={s.lat} lng={s.lng} label={s.name} bob
            selected={selected?.kind === 'story' && selected.id === s.id} onClick={() => onPick?.({ kind: 'story', id: s.id })}>
            <Orb color={s.stamped ? '#ffc93c' : TAG_COLOR[s.tag]} stamped={s.stamped} />
          </Pin>
        ))}

        <OrbitControls ref={controls} enablePan={false} enableDamping dampingFactor={0.08}
          minDistance={4} maxDistance={20} maxPolarAngle={Math.PI / 2.2} />
        <Rig controls={controls} focus={focus} focusKey={focus ? focus.join(',') : 'none'} />
      </Canvas>

      {/* 풍속·풍향 표시 */}
      <div style={{ position: 'absolute', left: 12, bottom: 12, pointerEvents: 'none', ...labelStyle, padding: '6px 12px' }}>
        <i className="bi bi-wind me-1" style={{ color: '#0aa2c0' }} />
        {hasWind ? `${wind.ms} m/s · ${COMPASS[Math.round((wind.vec % 360) / 22.5) % 16]}` : '–'}
      </div>
    </div>
  )
}
