import { useEffect, useState } from 'react'
import { Button, ButtonGroup, Col, Row } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import StoryCard from '../components/StoryCard'
import HarubangTrail from '../components/HarubangTrail'
import { Empty, ErrorAlert, Loading } from '../components/Status'
import { fetchStories } from '../api/client'
import { useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'

const TAGS = ['', 'myth', 'oreum', 'volcano']

// 오름·신화: "하르방 길"(돌하르방이 길목을 걸어가며 이야기를 들려줌)이 기본, "목록"은 카드로 한꺼번에 보기
export default function Stories() {
  const t = useT()
  const lang = useAppStore((s) => s.lang)
  const [view, setView] = useState('trail')   // 'trail' | 'list'
  const [tag, setTag] = useState('')
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true); setError('')
    fetchStories(lang).then(setAll).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [lang])

  const list = all.filter((s) => !tag || s.tag === tag)

  return (
    <>
      <PageHeader icon="book" title={t('storiesTitle')} subtitle={t('storiesSub')} />
      <ButtonGroup className="mb-4">
        {[['trail', 'trailTab', 'signpost-split'], ['list', 'listTab', 'list-ul']].map(([k, label, icon]) => (
          <Button key={k} variant={view === k ? 'dark' : 'outline-dark'} onClick={() => setView(k)} aria-pressed={view === k}>
            <i className={`bi bi-${icon} me-1`} />{t(label)}
          </Button>
        ))}
      </ButtonGroup>

      <ErrorAlert error={error} />
      {loading ? <Loading /> : view === 'trail' ? <HarubangTrail stories={all} /> : (
        <>
          <ButtonGroup className="mb-4 flex-wrap d-flex">
            {TAGS.map((x) => (
              <Button key={x} variant={tag === x ? 'dark' : 'outline-dark'} onClick={() => setTag(x)}>{x ? t(`tag_${x}`) : t('all')}</Button>
            ))}
          </ButtonGroup>
          {list.length === 0 ? <Empty /> : (
            <Row xs={1} lg={2} className="g-3">
              {list.map((s) => <Col key={s.id}><StoryCard story={s} /></Col>)}
            </Row>
          )}
        </>
      )}
    </>
  )
}
