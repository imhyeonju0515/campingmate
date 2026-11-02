import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, ButtonGroup, Col, Row } from 'react-bootstrap'
import ForecastStrip from '../components/ForecastStrip'
import { fetchCamps } from '../api/client'
import { campFit } from '../../server/wind.js'   // 서버와 같은 바람 적합도 규칙
import { useConditions, REGIONS } from '../lib/useConditions'
import { useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'
import Harubang from '../components/Harubang'
import ConditionCard from '../components/ConditionCard'
import CampCard from '../components/CampCard'
import { ErrorAlert } from '../components/Status'

// 홈 = 하르방 인사 + 오늘 두 지역 캠핑 컨디션 + 오늘 바람에 맞는 캠핑장 추천
export default function Home() {
  const t = useT()
  const lang = useAppStore((s) => s.lang)
  const stamps = useAppStore((s) => s.stamps)
  const { data: cond, failed } = useConditions()
  const [camps, setCamps] = useState([])
  const [error, setError] = useState('')
  const [fcPlace, setFcPlace] = useState(REGIONS[0])

  useEffect(() => {
    setError('')
    fetchCamps({ lang }).then(setCamps).catch(() => setError(t('apiFail')))
  }, [lang])   // eslint-disable-line react-hooks/exhaustive-deps

  const fitOf = (c) => (cond[c.region] ? campFit(c.types, cond[c.region].windGrade) : undefined)
  // 오늘 적합한 곳을 앞으로
  const rank = { good: 0, caution: 1, none: 1, avoid: 2 }
  const picks = [...camps].sort((a, b) => rank[fitOf(a) ?? 'none'] - rank[fitOf(b) ?? 'none']).slice(0, 3)

  const verdicts = REGIONS.map((r) => cond[r]?.camp).filter(Boolean)
  const walk = verdicts.includes('good') ? 'good' : verdicts.includes('ok') ? 'ok' : verdicts.includes('bad') ? 'bad' : 'unknown'
  const say = { good: t('saySunny'), ok: t('sayOk'), bad: t('sayBad') }[walk] ?? t('sayHello')
  const mood = walk === 'bad' ? 'worry' : walk === 'good' ? 'happy' : 'normal'

  return (
    <>
      <section className="card shadow-sm mb-4">
        <div className="card-body p-4 p-md-5">
          <Row className="align-items-center g-4">
            <Col xs={12} md="auto" className="text-center"><Harubang mood={mood} size={130} /></Col>
            <Col>
              <div className="small fw-bold text-info mb-1">JEJU CAMPMATE</div>
              <h1 className="fw-bold">{t('heroTitle')}</h1>
              <p className="text-muted">{t('heroSub')}</p>
              <div className="bubble d-inline-block mb-3">{say}</div>
              <div className="d-flex flex-wrap align-items-center gap-3">
                <Link to="/camps" className="btn btn-primary btn-lg">{t('start')} <i className="bi bi-arrow-right" /></Link>
                <Link to="/map" className="btn btn-outline-primary btn-lg"><i className="bi bi-globe-asia-australia me-1" />{t('map')}</Link>
                <span>{t('progress')} <b className="text-primary">{stamps.length}</b></span>
              </div>
            </Col>
          </Row>
        </div>
      </section>

      <ErrorAlert error={error} />
      <Row xs={1} md={2} className="g-3 mb-4">
        {REGIONS.map((r) => <Col key={r}><ConditionCard place={r} cond={cond[r]} failed={failed} /></Col>)}
      </Row>

      <h5 className="fw-bold mb-3"><i className="bi bi-calendar-week text-primary me-2" />{t('forecastTitle')}</h5>
      <ButtonGroup className="mb-3">
        {REGIONS.map((r) => <Button key={r} variant={fcPlace === r ? 'dark' : 'outline-dark'} size="sm" onClick={() => setFcPlace(r)}>{r}</Button>)}
      </ButtonGroup>
      <div className="mb-4"><ForecastStrip place={fcPlace} /></div>

      <Row xs={1} sm={2} lg={3} className="g-3">
        {picks.map((c) => <Col key={c.id}><CampCard camp={c} fit={fitOf(c)} /></Col>)}
      </Row>
    </>
  )
}
