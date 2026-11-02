import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Alert, Badge, Card, Col, Row } from 'react-bootstrap'
import ConditionCard from '../components/ConditionCard'
import StoryCard from '../components/StoryCard'
import ReserveCard from '../components/ReserveCard'
import ForecastStrip from '../components/ForecastStrip'
import FavButton from '../components/FavButton'
import AddressLink from '../components/AddressLink'
import { Empty, ErrorAlert, Loading } from '../components/Status'
import { fetchCamp, fetchCondition } from '../api/client'
import { campFit } from '../../server/wind.js'
import { useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'

const FIT_VARIANT = { good: 'success', caution: 'warning', avoid: 'danger' }
const TYPE_KEY = { normal: 't_normal', car: 't_car', glamp: 't_glamp', caravan: 't_caravan' }

export default function CampDetail() {
  const { id } = useParams()
  const t = useT()
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
  const { camp, stories, nearby } = data
  const fit = cond ? campFit(camp.types, cond.windGrade) : null

  return (
    <>
      <Link to="/camps" className="d-inline-block mb-3 fw-semibold"><i className="bi bi-arrow-left me-1" />{t('back')}</Link>

      <Card className="shadow-sm mb-4 overflow-hidden">
        {camp.image && <Card.Img src={camp.image} alt="" style={{ maxHeight: 260, objectFit: 'cover' }} />}
        <Card.Body className="p-4">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
            <Badge bg="info">{camp.region}</Badge>
            {camp.types.map((x) => <Badge key={x} bg="secondary">{t(TYPE_KEY[x])}</Badge>)}
            {camp.pet && <Badge bg="light" text="dark"><i className="bi bi-heart-fill text-danger me-1" />{t('pet')}</Badge>}
            <span className="small text-muted">{camp.source === 'gocamping' ? t('live') : t('sample')}</span>
          </div>
          <div className="d-flex justify-content-between align-items-start gap-2">
            <h1 className="fw-bold h2">{camp.name}</h1>
            <FavButton campId={camp.id} />
          </div>
          {camp.intro && <p className="text-muted mb-1">{camp.intro}</p>}
          {camp.addr && <div className="small"><i className="bi bi-geo-alt me-1" /><AddressLink addr={camp.addr} /></div>}
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

      <h5 className="fw-bold mb-3"><i className="bi bi-signpost-2-fill text-primary me-2" />{t('nearStories')}</h5>
      <Row xs={1} className="g-3 mb-4">
        {stories.map((s) => <Col key={s.id}><StoryCard story={s} campId={camp.id} /></Col>)}
      </Row>

      {nearby.length > 0 && (
        <>
          <h5 className="fw-bold mb-3">{t('nearTour')}</h5>
          <Row xs={1} sm={2} lg={3} className="g-3">
            {nearby.map((p) => (
              <Col key={p.id}>
                <Card><Card.Body className="d-flex gap-3 p-2">
                  {p.image && <img src={p.image} alt="" loading="lazy" className="rounded" style={{ width: 64, height: 64, objectFit: 'cover' }} />}
                  <div className="min-w-0"><div className="fw-bold small text-truncate">{p.title}</div><div className="small text-truncate"><AddressLink addr={p.addr} /></div></div>
                </Card.Body></Card>
              </Col>
            ))}
          </Row>
        </>
      )}
    </>
  )
}
