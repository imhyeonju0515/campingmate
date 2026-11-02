import { useEffect, useState } from 'react'
import { Button, ButtonGroup, Col, Form, InputGroup, Row } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import CampCard from '../components/CampCard'
import { Empty, ErrorAlert, Loading } from '../components/Status'
import { fetchCamps } from '../api/client'
import { campFit } from '../../server/wind.js'
import { useConditions } from '../lib/useConditions'
import { distKm, getPosition } from '../lib/geo'
import { useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'

const TYPES = ['', 'normal', 'car', 'glamp', 'caravan']
const TYPE_KEY = { normal: 't_normal', car: 't_car', glamp: 't_glamp', caravan: 't_caravan' }

export default function Camps() {
  const t = useT()
  const lang = useAppStore((s) => s.lang)
  const { data: cond } = useConditions()
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState('')
  const [camps, setCamps] = useState([])              // ① 데이터
  const [loading, setLoading] = useState(true)        // ② 로딩
  const [error, setError] = useState('')              // ③ 에러
  const favorites = useAppStore((s) => s.favorites)
  const toast = useAppStore((s) => s.toast)
  const [favOnly, setFavOnly] = useState(false)
  const [me, setMe] = useState(null)                   // 내 위치 { lat, lng } — 켜면 가까운 순
  const [locating, setLocating] = useState(false)

  async function search(e) {
    e?.preventDefault()                               // 폼 제출 시 새로고침 막기
    setLoading(true); setError('')
    try { setCamps(await fetchCamps({ lang, keyword, type })) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { search() }, [lang, type])         // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleNear() {
    if (me) return setMe(null)
    setLocating(true)
    try { setMe(await getPosition()) }
    catch (e) { toast(t(e.code === 'denied' ? 'stampDenied' : 'geoFail'), 'warning') }
    finally { setLocating(false) }
  }

  // 즐겨찾기 필터 → 내 위치가 있으면 가까운 순 정렬
  const shown = camps
    .filter((c) => !favOnly || favorites.includes(c.id))
    .map((c) => ({ c, km: me ? distKm(me.lat, me.lng, c.lat, c.lng) : null }))
    .sort((a, b) => (me ? a.km - b.km : 0))
  const farAway = me && shown.length > 0 && shown[0].km > 100

  const fitOf = (c) => (cond[c.region] ? campFit(c.types, cond[c.region].windGrade) : undefined)

  return (
    <>
      <PageHeader icon="tree" title={t('camps')} subtitle={t('campsSub')} />
      <Form onSubmit={search} className="mb-4 d-flex flex-wrap gap-2">
        <InputGroup style={{ maxWidth: 360 }}>
          <Form.Control value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={t('search')} />
          <Button type="submit"><i className="bi bi-search" /></Button>
        </InputGroup>
        <ButtonGroup className="flex-wrap">
          {TYPES.map((x) => (
            <Button key={x} variant={type === x ? 'dark' : 'outline-dark'} onClick={() => setType(x)}>{x ? t(TYPE_KEY[x]) : t('all')}</Button>
          ))}
        </ButtonGroup>
        <Button variant={favOnly ? 'dark' : 'outline-dark'} onClick={() => setFavOnly(!favOnly)} aria-pressed={favOnly}>
          <i className={`bi bi-heart${favOnly ? '-fill' : ''} me-1`} />{t('favOnly')}
        </Button>
        <Button variant={me ? 'dark' : 'outline-dark'} onClick={toggleNear} disabled={locating} aria-pressed={Boolean(me)}>
          <i className="bi bi-geo-alt-fill me-1" />{locating ? t('locating') : me ? t('nearOff') : t('nearMe')}
        </Button>
      </Form>

      <ErrorAlert error={error} />
      {farAway && <div className="alert alert-warning small"><i className="bi bi-info-circle me-1" />{t('farFromJeju')}</div>}
      {loading ? <Loading /> : shown.length === 0 ? (favOnly && camps.length ? <div className="text-muted">{t('favNone')}<div className="small mt-1">{t('favSyncHint')}</div></div> : <Empty />) : (
        <>
          {camps[0]?.source === 'sample' && <div className="alert alert-warning small"><i className="bi bi-info-circle me-1" />{t('sample')}</div>}
          <Row xs={1} sm={2} lg={3} className="g-3">
            {shown.map(({ c, km }) => <Col key={c.id}><CampCard camp={c} fit={fitOf(c)} km={km} /></Col>)}
          </Row>
        </>
      )}
    </>
  )
}
