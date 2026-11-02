import { Badge, Card, Col, Row } from 'react-bootstrap'
import { useArea, useT } from '../i18n'

const CAMP_BG = { good: 'success', ok: 'warning', bad: 'danger', unknown: 'secondary' }
const WIND_BG = { calm: 'success', breezy: 'info', strong: 'warning', danger: 'danger', unknown: 'secondary' }

// 오늘의 캠핑 컨디션 (기상청 풍속·강수 + 에어코리아 + 천문연구원 일몰) — 데이터는 부모가 넘겨 줍니다
export default function ConditionCard({ place, cond, failed }) {
  const t = useT()
  const area = useArea()
  const camp = failed ? 'unknown' : cond?.camp ?? 'unknown'
  const w = cond?.weather
  return (
    <Card className="h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="fw-bold small">{t('today')} · {area(place)}</span>
          <Badge bg={CAMP_BG[camp]}>{t(`camp_${camp}`)}</Badge>
        </div>
        {failed && !cond && <div className="small text-danger">{t('apiFail')}</div>}
        {cond && (
          <>
            <div className="d-flex align-items-center gap-3 mb-3 p-3 rounded-3 bg-light">
              {/* 화살표는 바람이 "불어 가는" 방향 (풍향은 불어오는 방향이라 180° 돌립니다) */}
              {w && <i className="bi bi-arrow-up fs-2 text-info" style={{ transform: `rotate(${(w.vec + 180) % 360}deg)` }} title={w.dir} />}
              <div>
                <div className="fs-4 fw-bold">{w ? `${w.wind} m/s` : '-'} {w && <small className="text-muted fs-6">{w.dir}</small>}</div>
                <Badge bg={WIND_BG[cond.windGrade]}>{t(`windG_${cond.windGrade}`)}</Badge>
              </div>
              <div className="small text-muted ms-auto" style={{ maxWidth: 220 }}>{t(`tip_${cond.windGrade}`)}</div>
            </div>
            <Row className="g-2 text-center">
              <Stat icon="thermometer-half" label={t('temp')} value={w ? `${w.temp}℃` : '-'} sub={w ? t(`sky_${w.skyCode}`) : ''} />
              <Stat icon="cloud-rain" label={t('rainProb')} value={w ? `${w.pop}%` : '-'} sub={w ? t(`pty_${w.ptyCode}`) : ''} />
              <Stat icon="sunset" label={t('sunset')} value={cond.sun?.sunset ?? '-'} sub={`${t('moon')} ${cond.moon.illumination}%`} />
              <Stat icon="wind" label={t('dust')} value={cond.air?.pm10 ?? '-'} sub={cond.air?.pm25 != null ? `PM2.5 ${cond.air.pm25}` : cond.air ? '' : t('noData')} />
            </Row>
            {cond.errors?.length > 0 && <div className="small text-muted mt-2">{t('condPartial')}</div>}
          </>
        )}
      </Card.Body>
    </Card>
  )
}

function Stat({ icon, label, value, sub }) {
  return (
    <Col xs={6} sm={3}>
      <div className="bg-light rounded-3 py-2 px-1">
        <i className={`bi bi-${icon} text-info`} />
        <div className="small text-muted">{label}</div>
        <div className="fs-5 fw-bold">{value}</div>
        <div className="small text-muted" style={{ minHeight: '1.2em' }}>{sub}</div>
      </div>
    </Col>
  )
}
