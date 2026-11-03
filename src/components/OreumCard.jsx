import { useState } from 'react'
import { Badge, Button, Card, Col, Row } from 'react-bootstrap'
import StampMark from './StampMark'
import OreumModal from './OreumModal'
import AddressLink from './AddressLink'
import NearCamps from './NearCamps'
import { useArea, useT } from '../i18n'
import { useStamp } from '../lib/useStamp'
import { useAppStore } from '../store/useAppStore'

const pick = (obj, lang = 'ko') => {
  if (!obj) return ''
  if (typeof obj === 'string') return obj // 이전 캐시 데이터와 호환
  return obj[lang] ?? obj.en ?? obj.ko ?? ''
}

// 오름 한 곳 (제주오름요약설명 + 한국관광공사 사진). 이야기 카드가 있는 곳은 StoryCard 를 씁니다.
export default function OreumCard({ oreum: o }) {
  const t = useT()
  const area = useArea()
  const lang = useAppStore((s) => s.lang)
  const [open, setOpen] = useState(false)
  const { stamp, onStamp, locating, fresh } = useStamp(o, null)

  return (
    <>
      <OreumModal oreum={o} show={open} onHide={() => setOpen(false)} />
      <Card className="h-100 oreum-card" role="button" tabIndex={0} aria-label={`${pick(o.name, lang)} ${t('placeMore')}`}
        onClick={() => setOpen(true)} onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpen(true) } }}>
        <Card.Body>
          <Row className="g-3">
            <Col>
              <div className="d-flex flex-wrap gap-1 mb-1">
                <Badge bg="success">{t('tag_oreum')}</Badge>
                <Badge bg="light" text="dark">{area(o.area)}</Badge>
                <Badge bg="light" text="dark">{t('oreumEle')} {o.elevation} m</Badge>
                <Badge bg="light" text="dark">{t('oreumRel')} {o.relHeight} m</Badge>
              </div>
              <Card.Title className="fw-bold">{pick(o.name, lang)}</Card.Title>
              {o.desc && <Card.Text className="small mb-1">{o.desc}</Card.Text>}
              <div className="small"><i className="bi bi-geo-alt-fill text-primary me-1" /><AddressLink addr={o.addr} ko={o.addrKo} /></div>
              <NearCamps camps={o.camps} compact />
            </Col>
            <Col xs={12} sm="auto" className="d-flex flex-column justify-content-center gap-2" onClick={(e) => e.stopPropagation()}>
              {o.image && (
                <img src={o.image} alt={pick(o.name, lang)} className="rounded" style={{ width: '100%', maxWidth: 150, height: 110, objectFit: 'cover', border: '2px solid #000' }} />
              )}
              {stamp
                ? <StampMark label={pick(o.name, lang)} date={stamp.at.slice(5, 10)} animate={fresh} />
                : (
                  <div className="text-center" style={{ width: 150 }}>
                    <Button onClick={onStamp} disabled={locating} className="w-100">
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
