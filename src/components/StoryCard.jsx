import { useEffect, useState } from 'react'
import { Badge, Button, Card, Col, Row } from 'react-bootstrap'
import StampMark from './StampMark'
import { fetchHeritage } from '../api/client'
import { distKm, getPosition, STAMP_RADIUS_KM } from '../lib/geo'
import { useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'

const TAG_BG = { myth: 'primary', oreum: 'success', volcano: 'danger' }

// 오름·신화 이야기 카드 + 도장 찍기 (스토리 목록·캠핑장 상세에서 재사용)
export default function StoryCard({ story, campId }) {
  const t = useT()
  const stamp = useAppStore((s) => s.stamps.find((x) => x.spotId === story.id))
  const stampSpot = useAppStore((s) => s.stampSpot)
  const toast = useAppStore((s) => s.toast)
  const [heritage, setHeritage] = useState([])
  const [fresh, setFresh] = useState(false)
  const [locating, setLocating] = useState(false)

  // 키워드가 있는 스팟은 국가유산청에서 관련 유산을 찾아 붙입니다 (실패해도 무시)
  useEffect(() => {
    if (story.keyword) fetchHeritage(story.keyword).then((l) => setHeritage(l.slice(0, 3))).catch(() => {})
  }, [story.keyword])

  // 도장은 이 스팟 1km 안에서만 찍힙니다 (브라우저 위치 기준 — 서버가 검증하는 것은 아니라서 진짜 부정 방지는 아님)
  async function onStamp() {
    setLocating(true)
    try {
      const me = await getPosition()
      const km = distKm(me.lat, me.lng, story.lat, story.lng)
      if (km > STAMP_RADIUS_KM) return toast(`${t('stampTooFar')} (${km.toFixed(1)} km)`, 'warning')
      await stampSpot({ spotId: story.id, name: story.name, tag: story.tag, campId })
      setFresh(true)
      toast(t('stampSay'))
    } catch (e) {
      toast(t({ unsupported: 'stampNoGeo', denied: 'stampDenied' }[e.code] ?? 'stampUnavail'), 'warning')
    } finally {
      setLocating(false)
    }
  }

  return (
    <Card className="h-100">
      <Card.Body>
        <Row className="align-items-center g-3">
          <Col xs={12} sm>
            <div className="d-flex flex-wrap gap-1 mb-1">
              <Badge bg={TAG_BG[story.tag]}>{t(`tag_${story.tag}`)}</Badge>
              <Badge bg="light" text="dark">{story.area}</Badge>
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
          <Col xs={12} sm="auto" className="d-flex justify-content-center" style={{ minWidth: 110 }}>
            {stamp
              ? <StampMark label={story.name} date={stamp.at.slice(5, 10)} animate={fresh} />
              : (
                <div className="text-center">
                  <Button onClick={onStamp} disabled={locating}>
                    <i className={`bi bi-${locating ? 'hourglass-split' : 'geo-alt-fill'} me-1`} />{locating ? t('stampLocating') : t('stamp')}
                  </Button>
                  <div className="small text-muted mt-1" style={{ maxWidth: 150 }}>{t('stampNote')}</div>
                </div>
              )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}
