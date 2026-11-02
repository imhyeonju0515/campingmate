import { useEffect, useState } from 'react'
import { Button, ButtonGroup, Col, Form, InputGroup, Row } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import CampCard from '../components/CampCard'
import { Empty, ErrorAlert, Loading } from '../components/Status'
import { fetchCamps } from '../api/client'
import { campFit } from '../../server/wind.js'
import { useConditions } from '../lib/useConditions'
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

  async function search(e) {
    e?.preventDefault()                               // 폼 제출 시 새로고침 막기
    setLoading(true); setError('')
    try { setCamps(await fetchCamps({ lang, keyword, type })) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { search() }, [lang, type])         // eslint-disable-line react-hooks/exhaustive-deps

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
      </Form>

      <ErrorAlert error={error} />
      {loading ? <Loading /> : camps.length === 0 ? <Empty /> : (
        <>
          {camps[0]?.source === 'sample' && <div className="alert alert-warning small"><i className="bi bi-info-circle me-1" />{t('sample')}</div>}
          <Row xs={1} sm={2} lg={3} className="g-3">
            {camps.map((c) => <Col key={c.id}><CampCard camp={c} fit={fitOf(c)} /></Col>)}
          </Row>
        </>
      )}
    </>
  )
}
