import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, ButtonGroup, Col, Form, Row } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import StoryCard from '../components/StoryCard'
import OreumCard from '../components/OreumCard'
import SeasonSelector from '../components/SeasonSelector'
import { Empty, ErrorAlert, Loading } from '../components/Status'
import { fetchOreums, fetchStories } from '../api/client'
import { useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'

const TAGS = ['', 'myth', 'oreum', 'volcano']
const PAGE = 24   // 처음에 보여 주는 개수 (더 보기로 늘림)

// 오름·신화·화산 전체 목록: 이야기 카드 9곳(도장 가능) + 제주오름요약설명의 오름들
export default function Stories() {
  const t = useT()
  const lang = useAppStore((s) => s.lang)
  const [params] = useSearchParams()   // /stories?spot=s-sanbang → 그 카드로 스크롤하고 상세 창을 엽니다
  const spot = params.get('spot')
  const [season, setSeason] = useState('AUTUMN')
  const [tag, setTag] = useState('')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [stories, setStories] = useState([])
  const [oreums, setOreums] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true); setError('')
    Promise.all([fetchStories(lang), fetchOreums(lang)])
      .then(([s, o]) => { setStories(s); setOreums(o) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [lang])

  // 이야기 카드(길 순서) 먼저, 그다음 오름. 태그·검색어로 거름
  const list = useMemo(() => {
    const kw = q.trim().toLowerCase()
    const match = (x) => (!tag || x.tag === tag) && (!kw || `${x.name} ${x.area} ${x.loc ?? ''}`.toLowerCase().includes(kw))
    return [...[...stories].sort((a, b) => a.order - b.order).map((s) => ({ ...s, kind: 'story' })), ...oreums].filter(match)
  }, [stories, oreums, tag, q])

  // ?spot= 으로 들어오면 그 카드로 스크롤
  useEffect(() => {
    if (!spot || loading) return
    document.getElementById(`spot-${spot}`)?.scrollIntoView({ block: 'center' })
  }, [spot, loading])

  const shown = list.slice(0, limit)

  return (
    <>
      <PageHeader icon="book" title={t('storiesTitle')} subtitle={t('storiesSub')} />
      <SeasonSelector season={season} onSeasonChange={setSeason} />
      <div className="d-flex flex-wrap gap-2 mb-3">
        <ButtonGroup className="flex-wrap">
          {TAGS.map((x) => (
            <Button key={x} variant={tag === x ? 'dark' : 'outline-dark'} onClick={() => { setTag(x); setLimit(PAGE) }}>{x ? t(`tag_${x}`) : t('all')}</Button>
          ))}
        </ButtonGroup>
        <Form.Control style={{ maxWidth: 260 }} value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE) }} placeholder={t('oreumSearch')} aria-label={t('oreumSearch')} />
      </div>
      <div className="small text-muted mb-3">{list.length} {t('ppSpots')}</div>

      <ErrorAlert error={error} />
      {loading ? <Loading /> : list.length === 0 ? <Empty /> : (
        <>
          <Row xs={1} lg={2} className="g-3">
            {shown.map((x) => (
              <Col key={x.id} id={`spot-${x.id}`}>
                {x.kind === 'story' ? <StoryCard story={x} defaultOpen={x.id === spot} /> : <OreumCard oreum={x} />}
              </Col>
            ))}
          </Row>
          {list.length > limit && (
            <div className="text-center mt-4">
              <Button variant="outline-dark" onClick={() => setLimit((n) => n + PAGE)}>{t('moreBtn')} ({list.length - limit})</Button>
            </div>
          )}
        </>
      )}
    </>
  )
}
