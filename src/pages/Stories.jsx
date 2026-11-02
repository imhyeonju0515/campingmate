import { useEffect, useState } from 'react'
import { Button, ButtonGroup, Col, Row } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import StoryCard from '../components/StoryCard'
import { Empty, ErrorAlert, Loading } from '../components/Status'
import { fetchStories } from '../api/client'
import { useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'

const TAGS = ['', 'myth', 'oreum', 'volcano']

export default function Stories() {
  const t = useT()
  const lang = useAppStore((s) => s.lang)
  const [tag, setTag] = useState('')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true); setError('')
    fetchStories(lang, tag).then(setList).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [lang, tag])

  return (
    <>
      <PageHeader icon="book" title={t('storiesTitle')} subtitle={t('storiesSub')} />
      <ButtonGroup className="mb-4 flex-wrap">
        {TAGS.map((x) => (
          <Button key={x} variant={tag === x ? 'dark' : 'outline-dark'} onClick={() => setTag(x)}>{x ? t(`tag_${x}`) : t('all')}</Button>
        ))}
      </ButtonGroup>
      <ErrorAlert error={error} />
      {loading ? <Loading /> : list.length === 0 ? <Empty /> : (
        <Row xs={1} lg={2} className="g-3">
          {list.map((s) => <Col key={s.id}><StoryCard story={s} /></Col>)}
        </Row>
      )}
    </>
  )
}
