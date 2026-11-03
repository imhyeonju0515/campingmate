import { useEffect, useState } from 'react'
import { Badge, Button, Card, Col, Row } from 'react-bootstrap'
import StampMark from './StampMark'
import StoryModal from './StoryModal'
import { fetchHeritage } from '../api/client'
import { useStamp } from '../lib/useStamp'
import { useArea, useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'

const TAG_BG = { myth: 'primary', oreum: 'success', volcano: 'danger' }

// 오름·신화 이야기 카드 + 도장 찍기 (스토리 목록·캠핑장 상세에서 재사용)
export default function StoryCard({ story, campId, defaultOpen = false, stacked = false }) {
  const t = useT()
  const area = useArea()
  const lang = useAppStore((s) => s.lang)
  const { stamp, onStamp, locating, fresh } = useStamp(story, campId)
  const [heritage, setHeritage] = useState([])
  const [open, setOpen] = useState(defaultOpen)   // ?spot= 으로 들어오면 상세 창을 바로 엽니다

  // 키워드가 있는 스팟은 국가유산청에서 관련 유산을 찾아 붙입니다 (실패해도 무시)
  useEffect(() => {
    if (story.keyword) fetchHeritage(story.keyword, lang).then((l) => setHeritage(l.slice(0, 3))).catch(() => {})
  }, [story.keyword, lang])

  // 모달은 카드 "밖"(형제)에 둡니다. 안에 두면 모달 안 클릭이 React 트리를 타고 카드의 onClick 까지 올라가서
  // 닫기를 눌러도 곧바로 다시 열려 버립니다.
  return (
    <>
    <StoryModal story={story} show={open} onHide={() => setOpen(false)} />
    <Card className="h-100 story-card" role="button" tabIndex={0} aria-label={`${story.name} ${t('placeMore')}`}
      onClick={() => setOpen(true)} onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpen(true) } }}>
      <Card.Body className={stacked ? 'd-flex flex-column p-3' : ''}>
        <Row className={stacked ? 'g-3 flex-grow-1 align-content-between' : 'align-items-center g-3'}>
          <Col xs={12} sm={stacked ? 12 : true}>
            <div className="d-flex flex-wrap gap-1 mb-1">
              <Badge bg={TAG_BG[story.tag]}>{t(`tag_${story.tag}`)}</Badge>
              <Badge bg="light" text="dark">{area(story.area)}</Badge>
              {story.km != null && <Badge bg="light" text="dark"><i className="bi bi-geo-alt me-1" />{story.km} km</Badge>}
            </div>
            <Card.Title className="fw-bold">{story.name}</Card.Title>
            <div className="small fw-bold text-info">{t('storyCard')}</div>
            <Card.Text className="small mb-1">{story.story}</Card.Text>
            {heritage.length > 0 && (
              <div className="small text-muted">
                <i className="bi bi-bank me-1 text-primary" />{t('heritage')}:{' '}
                {heritage.map((h, k) => <Badge key={k} bg="light" text="dark" className="me-1">{h.name}{h.kind ? ` · ${h.kind}` : ''}</Badge>)}
              </div>
            )}
          </Col>
          <Col xs={12} sm={stacked ? 12 : 'auto'} className="d-flex justify-content-center" style={stacked ? { borderTop: '1px solid #dee2e6', paddingTop: 12 } : undefined} onClick={(e) => e.stopPropagation()}>
            {stamp
              ? <StampMark label={story.name} date={stamp.at.slice(5, 10)} animate={fresh} />
              : (
                <div className="text-center" style={{ width: stacked ? '100%' : 150 }}>
                  <Button onClick={onStamp} disabled={locating} className="w-100" size={stacked ? 'sm' : undefined} variant={stacked ? 'warning' : undefined}>
                    <i className={`bi bi-${locating ? 'hourglass-split' : 'geo-alt-fill'} me-1`} />{locating ? t('stampLocating') : t('stamp')}
                  </Button>
                  <div className="small text-muted mt-2" style={{ fontSize: '0.85rem' }}>{t('stampNote')}</div>
                </div>
              )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
    </>
  )
}
