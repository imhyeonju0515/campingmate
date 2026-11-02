import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Badge, Card, Col, Form, Row } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import CampCard from '../components/CampCard'
import StoryCard from '../components/StoryCard'
import { ErrorAlert, Loading } from '../components/Status'
import { fetchCamps, fetchStories } from '../api/client'
import { campFit } from '../../server/wind.js'
import { useConditions, REGIONS } from '../lib/useConditions'
import { useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'

// three.js 는 용량이 커서 이 페이지에 들어올 때만 불러옵니다
const Jeju3D = lazy(() => import('../components/Jeju3D'))

const FIT_BADGE = { good: 'success', caution: 'warning', avoid: 'danger' }
const TAG_COLOR = { myth: '#8e44ad', oreum: '#198754', volcano: '#c0392b' }

// 두 지역의 바람 벡터를 평균 → { ms, vec }  (풍향 vec 은 "불어오는" 방향)
function meanWind(cond) {
  let x = 0, z = 0, n = 0
  for (const r of REGIONS) {
    const w = cond[r]?.weather
    if (!w || !Number.isFinite(w.wind) || !Number.isFinite(w.vec)) continue
    const to = ((w.vec + 180) * Math.PI) / 180
    x += w.wind * Math.sin(to); z += -w.wind * Math.cos(to); n++
  }
  if (!n) return null
  x /= n; z /= n
  return { ms: Math.round(Math.hypot(x, z) * 10) / 10, vec: (((Math.atan2(x, -z) * 180) / Math.PI + 180) % 360 + 360) % 360 }
}

export default function MapPage() {
  const t = useT()
  const lang = useAppStore((s) => s.lang)
  const stamps = useAppStore((s) => s.stamps)
  const { data: cond } = useConditions()
  const [camps, setCamps] = useState([])
  const [stories, setStories] = useState([])
  const [error, setError] = useState('')
  const [sel, setSel] = useState(null)
  const [layers, setLayers] = useState({ camps: true, stories: true, wind: true })

  useEffect(() => {
    setError('')
    Promise.all([fetchCamps({ lang }), fetchStories(lang)])
      .then(([c, s]) => { setCamps(c); setStories(s) })
      .catch(() => setError(t('apiFail')))
  }, [lang])   // eslint-disable-line react-hooks/exhaustive-deps

  // 시연·확인용: /map?wind=8,270 (풍속 m/s, 풍향 도) 이면 API 값 대신 이 바람을 씁니다
  const demo = useMemo(() => {
    const [ms, vec] = (new URLSearchParams(window.location.search).get('wind') ?? '').split(',').map(Number)
    return Number.isFinite(ms) && Number.isFinite(vec) ? { ms, vec } : null
  }, [])
  const wind = useMemo(() => demo ?? meanWind(cond), [demo, cond])
  const fitOf = (c) => (cond[c.region] ? campFit(c.types, cond[c.region].windGrade) : null)
  const campPins = camps.map((c) => ({ ...c, fit: fitOf(c) }))
  const storyPins = stories.map((s) => ({ ...s, stamped: stamps.some((x) => x.spotId === s.id) }))

  const picked = sel?.kind === 'camp' ? campPins.find((c) => c.id === sel.id)
    : sel?.kind === 'story' ? stories.find((s) => s.id === sel.id) : null
  const toggle = (k) => setLayers((l) => ({ ...l, [k]: !l[k] }))

  return (
    <>
      <PageHeader icon="globe-asia-australia" title={t('mapTitle')} subtitle={t('mapSub')} />
      <ErrorAlert error={error} />
      <Row className="g-3">
        <Col lg={8}>
          <Card className="overflow-hidden">
            <Suspense fallback={<Loading />}>
              <Jeju3D camps={campPins} stories={storyPins} wind={layers.wind ? wind : null}
                showCamps={layers.camps} showStories={layers.stories} selected={sel} onPick={setSel} height="min(70vh, 540px)" />
            </Suspense>
            <Card.Footer className="small text-muted"><i className="bi bi-hand-index me-1" />{t('dragHint')}</Card.Footer>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="mb-3">
            <Card.Body>
              <Form.Check type="switch" id="l-camps" label={t('layerCamps')} checked={layers.camps} onChange={() => toggle('camps')} />
              <Form.Check type="switch" id="l-stories" label={t('layerStories')} checked={layers.stories} onChange={() => toggle('stories')} />
              <Form.Check type="switch" id="l-wind" label={t('layerWind')} checked={layers.wind} onChange={() => toggle('wind')} />
              <div className="small mt-2">
                <i className="bi bi-wind text-info me-1" />
                {wind ? `${t('windNow')}: ${wind.ms} m/s · ${Math.round(wind.vec)}°${demo ? ' (demo)' : ''}` : t('windNone')}
              </div>
              <hr />
              <div className="small d-flex flex-wrap gap-2">
                {['good', 'caution', 'avoid'].map((f) => <Badge key={f} bg={FIT_BADGE[f]}>⛺ {t(`fit_${f}`)}</Badge>)}
                {['myth', 'oreum', 'volcano'].map((g) => (
                  <Badge key={g} style={{ background: TAG_COLOR[g] }}>● {t(`tag_${g}`)}</Badge>
                ))}
                <Badge bg="warning" text="dark">● {t('stamped')}</Badge>
              </div>
            </Card.Body>
          </Card>

          {picked
            ? (sel.kind === 'camp' ? <CampCard camp={picked} fit={picked.fit} /> : <StoryCard story={picked} />)
            : <Card body className="text-muted small text-center">{t('pickHint')}</Card>}
        </Col>
      </Row>
    </>
  )
}
