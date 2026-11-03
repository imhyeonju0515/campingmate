import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert, Badge, Button, Card, Col, Row } from 'react-bootstrap'
import ConditionCard from '../components/ConditionCard'
import StoryCard from '../components/StoryCard'
import ReserveCard from '../components/ReserveCard'
import ForecastStrip from '../components/ForecastStrip'
import FavButton from '../components/FavButton'
import AddressLink from '../components/AddressLink'
import StampMark from '../components/StampMark'
import { Empty, ErrorAlert, Loading } from '../components/Status'
import { fetchCamp, fetchCondition } from '../api/client'
import { campFit } from '../../server/wind.js'
import { useArea, useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'
import { useStamp } from '../lib/useStamp'

const FIT_VARIANT = { good: 'success', caution: 'warning', avoid: 'danger' }
const TYPE_KEY = { normal: 't_normal', car: 't_car', glamp: 't_glamp', caravan: 't_caravan' }

// 오름 + 도장찍기 카드
function OreumStampCard({ oreum, t }) {
  const { stamp, onStamp, locating, fresh } = useStamp(oreum, null)

  return (
    <Card className="h-100">
      <Card.Body className="d-flex flex-column gap-2 p-3">
        {oreum.image && <img src={oreum.image} alt={oreum.name} loading="lazy" className="rounded" style={{ height: 120, objectFit: 'cover', border: '2px solid #000' }} />}
        <div>
          <div className="fw-bold">{oreum.name}</div>
          <div className="small"><i className="bi bi-geo-alt-fill text-primary me-1" />{oreum.km} km</div>
          <div className="d-flex flex-wrap gap-1 my-1">
            <Badge bg="light" text="dark" className="small">{t('oreumEle')} {oreum.elevation} m</Badge>
            <Badge bg="light" text="dark" className="small">{t('oreumRel')} {oreum.relHeight} m</Badge>
          </div>
          {oreum.desc && <div className="small text-muted">{oreum.desc}</div>}
          <div className="small"><AddressLink addr={oreum.addr} ko={oreum.addrKo} /></div>
        </div>
        <div className="mt-auto pt-2 border-top">
          {stamp
            ? <StampMark label={oreum.name} date={stamp.at.slice(5, 10)} animate={fresh} />
            : (
              <div className="d-grid">
                <Button size="sm" onClick={onStamp} disabled={locating}>
                  <i className={`bi bi-${locating ? 'hourglass-split' : 'geo-alt-fill'} me-1`} />{locating ? t('stampLocating') : t('stamp')}
                </Button>
                <div className="small text-muted text-center mt-2" style={{ fontSize: '0.80rem' }}>{t('stampNote')}</div>
              </div>
            )}
        </div>
      </Card.Body>
    </Card>
  )
}

export default function CampDetail() {
  const { id } = useParams()
  const t = useT()
  const area = useArea()
  const lang = useAppStore((s) => s.lang)
  const [data, setData] = useState(null)
  const [cond, setCond] = useState(null)
  const [condFailed, setCondFailed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true); setError('')
    fetchCamp(id, lang).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [id, lang])

  useEffect(() => {
    if (!data) return
    setCond(null); setCondFailed(false)
    fetchCondition(data.camp.region).then(setCond).catch(() => setCondFailed(true))
  }, [data?.camp.region])   // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Loading />
  if (error) return <ErrorAlert error={error} />
  if (!data) return <Empty />
  const { camp, stories, nearby, oreums = [] } = data
  const fit = cond ? campFit(camp.types, cond.windGrade) : null

  return (
    <>
      <Link to="/camps" className="d-inline-block mb-3 fw-semibold"><i className="bi bi-arrow-left me-1" />{t('back')}</Link>

      <Card className="shadow-sm mb-4 overflow-hidden">
        {camp.image && <Card.Img src={camp.image} alt="" style={{ maxHeight: 260, objectFit: 'cover' }} />}
        <Card.Body className="p-4">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
            <Badge bg="info">{area(camp.region)}</Badge>
            {camp.types.map((x) => <Badge key={x} bg="secondary">{t(TYPE_KEY[x])}</Badge>)}
            {camp.pet && <Badge bg="light" text="dark"><i className="bi bi-heart-fill text-danger me-1" />{t('pet')}</Badge>}
            <span className="small text-muted">{camp.source === 'gocamping' ? t('live') : t('sample')}</span>
          </div>
          <div className="d-flex justify-content-between align-items-start gap-2">
            <h1 className="fw-bold h2">{camp.name}</h1>
            <FavButton campId={camp.id} />
          </div>
          {camp.intro && <p className="text-muted mb-1">{camp.intro}{lang !== 'ko' && camp.source === 'gocamping' && <span className="d-block small fst-italic">{t('introKoNote')}</span>}</p>}
          {camp.addr && <div className="small"><i className="bi bi-geo-alt me-1" /><AddressLink addr={camp.addr} ko={camp.addrKo} /></div>}
        </Card.Body>
      </Card>

      {camp.source === 'gocamping' && <ReserveCard camp={camp} />}

      {fit && (
        <Alert variant={FIT_VARIANT[fit]} className="fw-semibold">
          <i className="bi bi-wind me-2" />{t(`fit_${fit}`)} — {t(`tip_${cond.windGrade}`)}
        </Alert>
      )}
      <div className="mb-4"><ConditionCard place={camp.region} cond={cond} failed={condFailed} /></div>

      <h5 className="fw-bold mb-3"><i className="bi bi-calendar-week text-primary me-2" />{t('forecastTitle')}</h5>
      <div className="mb-4"><ForecastStrip place={camp.region} types={camp.types} /></div>

      <h5 className="fw-bold mb-3"><i className="bi bi-triangle-fill text-primary me-2" />{t('nearOreums')} & {t('nearStories')}</h5>
      {(oreums.length > 0 || stories.length > 0 || nearby.length > 0) ? (
        <Row xs={1} sm={2} lg={3} className="g-3 mb-4">
          {oreums.map((o) => (
            <Col key={`oreum-${o.id}`}>
              <OreumStampCard oreum={o} t={t} />
            </Col>
          ))}
          {stories.map((s) => (
            <Col key={`story-${s.id}`}><StoryCard story={s} campId={camp.id} /></Col>
          ))}
          {nearby.map((p) => (
            <Col key={`tour-${p.id}`}>
              <Card><Card.Body className="d-flex gap-3 p-2">
                {p.image && <img src={p.image} alt="" loading="lazy" className="rounded" style={{ width: 64, height: 64, objectFit: 'cover' }} />}
                <div className="min-w-0"><div className="fw-bold small text-truncate">{p.title}</div><div className="small text-truncate"><AddressLink addr={p.addr} /></div></div>
              </Card.Body></Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="text-muted small mb-4">{t('noNearby')}</div>
      )}
    </>
  )
}
