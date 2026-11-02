import { useEffect, useState } from 'react'
import { Badge, Card, Col, Row } from 'react-bootstrap'
import { fetchForecast } from '../api/client'
import { campFit, windGrade } from '../../server/wind.js'
import { useT } from '../i18n'
import { Loading } from './Status'

const FIT_BG = { good: 'success', caution: 'warning', avoid: 'danger' }
const DAY_KEY = ['fcToday', 'fcTomorrow', 'fcAfter']
const RANK = { good: 0, caution: 1, avoid: 2 }

// 오늘부터 3일 날짜별 바람 예보. types 를 주면 그 캠핑장 유형 기준으로 "좋음/주의/비추천"을 표시하고,
// 안 주면 일반 텐트(가장 바람에 약한 유형) 기준으로 보여 줍니다.
export default function ForecastStrip({ place, types = ['normal'] }) {
  const t = useT()
  const [days, setDays] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setDays(null); setFailed(false)
    fetchForecast(place).then(setDays).catch(() => setFailed(true))
  }, [place])

  if (failed) return <div className="small text-muted">{t('fcFail')}</div>
  if (!days) return <Loading />

  const rows = days.map((d, i) => {
    const grade = windGrade(d.windMax)
    let fit = campFit(types, grade)
    if (fit === 'good' && (d.rain || d.popMax >= 60)) fit = 'caution'   // 비 예보가 있으면 "딱 좋음"은 아님
    return { ...d, grade, fit, i }
  })
  const best = rows.filter((r) => r.fit).sort((a, b) => RANK[a.fit] - RANK[b.fit] || a.windMax - b.windMax)[0]

  return (
    <>
      <Row xs={3} className="g-2">
        {rows.map((r) => (
          <Col key={r.date}>
            <Card className="h-100 text-center">
              <Card.Body className="p-2">
                <div className="small fw-bold">{t(DAY_KEY[r.i])}</div>
                <div className="small text-muted mb-1">{r.date.slice(5).replace('-', '/')}</div>
                <div className="fs-5 fw-bold">{r.windMax != null ? r.windMax : '-'}<span className="small fw-normal"> m/s</span></div>
                <div className="small text-muted">{t('fcMax')}{r.dir ? ` · ${r.dir}` : ''}</div>
                <div className="small my-1"><i className="bi bi-droplet me-1" />{r.popMax}%</div>
                {r.fit && <Badge bg={FIT_BG[r.fit]}>{t(`fit_${r.fit}`)}</Badge>}
                {best && best.date === r.date && <div className="small fw-bold text-primary mt-1"><i className="bi bi-star-fill me-1" />{t('fcBest')}</div>}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      <div className="small text-muted mt-2">{t('fcNote')}</div>
    </>
  )
}
