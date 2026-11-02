import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button } from 'react-bootstrap'
import Harubang from './Harubang'
import StampMark from './StampMark'
import StoryModal from './StoryModal'
import { COAST_LATLNG, MAP } from '../lib/jejuCoast'
import { useStamp } from '../lib/useStamp'
import { useArea, useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'

const TAG_BG = { myth: 'primary', oreum: 'success', volcano: 'danger' }
const { W, H, px, py } = MAP

// 글자가 한 글자씩 나타나는 효과 (움직임을 줄이도록 설정한 사용자에게는 바로 전체를 보여 줍니다)
function TypeText({ text }) {
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const [n, setN] = useState(reduce ? text.length : 0)
  useEffect(() => {
    if (reduce) { setN(text.length); return undefined }
    setN(0)
    const id = setInterval(() => setN((x) => { if (x >= text.length) { clearInterval(id); return x } return x + 1 }), 26)
    return () => clearInterval(id)
  }, [text, reduce])
  return (
    <>
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">{text.slice(0, n)}</span>
    </>
  )
}

// 현재 길목에서 할 수 있는 것: 자세히 보기 · 도장 찍기
function StopActions({ story, onDetail }) {
  const t = useT()
  const { stamp, onStamp, locating, fresh } = useStamp(story)
  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
      <Button variant="outline-dark" size="sm" onClick={onDetail}><i className="bi bi-image me-1" />{t('placeMore')}</Button>
      {stamp
        ? <StampMark label={story.name} date={stamp.at.slice(5, 10)} animate={fresh} size={64} />
        : (
          <Button size="sm" onClick={onStamp} disabled={locating}>
            <i className={`bi bi-${locating ? 'hourglass-split' : 'geo-alt-fill'} me-1`} />{locating ? t('stampLocating') : t('stamp')}
          </Button>
        )}
    </div>
  )
}

// 하르방 길: 제주 윤곽 위에서 돌하르방이 길목(스팟)을 하나씩 걸어가며 이야기를 들려줍니다.
// 길 순서는 server/data/stories.js 의 order. 윤곽·좌표는 대략값이라 정확한 지도가 아니라 "이야기 길" 그림입니다.
export default function HarubangTrail({ stories }) {
  const t = useT()
  const area = useArea()
  const stamps = useAppStore((s) => s.stamps)
  const stops = useMemo(() => [...stories].sort((a, b) => a.order - b.order), [stories])
  const stamped = useMemo(() => new Set(stamps.map((s) => s.spotId)), [stamps])
  const [i, setI] = useState(0)
  const [walking, setWalking] = useState(false)
  const [open, setOpen] = useState(false)

  // 처음 들어오면 아직 도장을 못 받은 첫 길목에서 시작 (이어서 걷기)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    if (started || stops.length === 0) return
    const first = stops.findIndex((s) => !stamped.has(s.id))
    setI(first < 0 ? 0 : first)
    setStarted(true)
  }, [stops, stamped, started])

  // 지도 위 표시 위치: 실제 좌표를 투영하되, 가까운 길목끼리 겹치면(용눈이·다랑쉬오름 등) 살짝 밀어 번호가 가리지 않게 함
  const pos = useMemo(() => {
    const MIN = 26, out = []
    stops.forEach((s) => {
      let x = px(s.lng), y = py(s.lat)
      out.forEach((q) => {
        const dx = x - q.x, dy = y - q.y, d = Math.hypot(dx, dy)
        if (d < MIN) { const ux = d ? dx / d : 0.7, uy = d ? dy / d : -0.7; x = q.x + ux * MIN; y = q.y + uy * MIN }
      })
      out.push({ x, y })
    })
    return out
  }, [stops])

  if (stops.length === 0) return null
  const cur = stops[i]
  const allDone = stops.every((s) => stamped.has(s.id))

  function go(n) {
    const next = Math.max(0, Math.min(stops.length - 1, n))
    if (next === i) return
    setI(next); setWalking(true)
    setTimeout(() => setWalking(false), 1000)
  }

  const outline = COAST_LATLNG.map(([la, lo]) => `${px(lo).toFixed(1)},${py(la).toFixed(1)}`).join(' ')
  const pts = (n) => pos.slice(0, n).map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ')

  return (
    <div className="harubang-trail">
      <div className="trail-map" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-100 h-100" role="img" aria-label={t('trailTab')}>
          <polygon points={outline} fill="var(--lime-soft)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
          <polyline points={pts(stops.length)} fill="none" stroke="#000" strokeOpacity=".35" strokeWidth="2.5" strokeDasharray="5 5" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={pts(i + 1)} fill="none" stroke="var(--brand)" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          {stops.map((s, k) => {
            const on = stamped.has(s.id), here = k === i
            return (
              <g key={s.id} className="trail-node" role="button" tabIndex={0} aria-label={`${k + 1}. ${s.name}`}
                onClick={() => go(k)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(k) } }}>
                {here && <circle cx={pos[k].x} cy={pos[k].y} r="15" fill="none" stroke="#000" strokeWidth="2" className="trail-pulse" />}
                <circle cx={pos[k].x} cy={pos[k].y} r={here ? 11 : 9} fill={on ? 'var(--green)' : '#fff'} stroke="#000" strokeWidth="2.5" />
                <text x={pos[k].x} y={pos[k].y + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#000">{k + 1}</text>
              </g>
            )
          })}
        </svg>
        {/* 하르방: 길목이 바뀌면 그 자리로 걸어갑니다 (걷는 동안 통통 뜀) */}
        <div className={`trail-harubang ${walking ? 'walking' : ''}`} style={{ left: `${(pos[i].x / W) * 100}%`, top: `${(pos[i].y / H) * 100}%` }}>
          <Harubang mood={stamped.has(cur.id) ? 'happy' : 'normal'} size={46} />
        </div>
      </div>

      <div className="bubble bubble-up trail-bubble mt-3" key={cur.id}>
        <div className="d-flex flex-wrap align-items-center gap-1 mb-1">
          <Badge bg="dark">{i + 1} / {stops.length}</Badge>
          <Badge bg={TAG_BG[cur.tag]}>{t(`tag_${cur.tag}`)}</Badge>
          <Badge bg="light" text="dark">{area(cur.area)}</Badge>
        </div>
        <div className="trail-title">{cur.name}</div>
        <div className="trail-text"><TypeText text={cur.story} /></div>
        <StopActions story={cur} onDetail={() => setOpen(true)} />
      </div>
      <StoryModal story={cur} show={open} onHide={() => setOpen(false)} />

      <div className="d-flex align-items-center justify-content-between gap-2 mt-3">
        <Button variant="outline-dark" onClick={() => go(i - 1)} disabled={i === 0}><i className="bi bi-chevron-left me-1" />{t('trailPrev')}</Button>
        <div className="trail-dots" aria-hidden="true">
          {stops.map((s, k) => <button key={s.id} type="button" tabIndex={-1} className={`${k === i ? 'here' : ''} ${stamped.has(s.id) ? 'done' : ''}`} onClick={() => go(k)} />)}
        </div>
        <Button onClick={() => go(i + 1)} disabled={i === stops.length - 1}>{t('trailNext')}<i className="bi bi-chevron-right ms-1" /></Button>
      </div>

      {allDone && (
        <div className="alert alert-success mt-3 mb-0 fw-bold">
          <i className="bi bi-trophy-fill me-2" />{t('trailDone')} <Link to="/passport" className="alert-link ms-1">{t('passportTitle')} →</Link>
        </div>
      )}
    </div>
  )
}
