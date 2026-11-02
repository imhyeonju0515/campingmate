import { Badge, Card, Col, Row } from 'react-bootstrap'
import AddressLink from './AddressLink'
import NearCamps from './NearCamps'
import { useArea, useT } from '../i18n'

// 오름 한 곳 (제주오름요약설명 + 한국관광공사 사진). 이야기 카드가 있는 곳은 StoryCard 를 씁니다.
export default function OreumCard({ oreum: o }) {
  const t = useT()
  const area = useArea()
  return (
    <Card className="h-100">
      <Card.Body>
        <Row className="g-3">
          <Col>
            <div className="d-flex flex-wrap gap-1 mb-1">
              <Badge bg="success">{t('tag_oreum')}</Badge>
              <Badge bg="light" text="dark">{area(o.area)}</Badge>
              <Badge bg="light" text="dark">{t('oreumEle')} {o.elevation} m</Badge>
              <Badge bg="light" text="dark">{t('oreumRel')} {o.relHeight} m</Badge>
            </div>
            <Card.Title className="fw-bold">{o.name}</Card.Title>
            {o.desc && <Card.Text className="small mb-1">{o.desc}</Card.Text>}
            <div className="small"><i className="bi bi-geo-alt-fill text-primary me-1" /><AddressLink addr={o.addr} ko={o.addrKo} /></div>
            <NearCamps camps={o.camps} compact />
          </Col>
          {o.image && (
            <Col xs={12} sm="auto">
              <img src={o.image} alt={o.name} loading="lazy" className="rounded" style={{ width: '100%', maxWidth: 140, height: 110, objectFit: 'cover', border: '2px solid #000' }} />
            </Col>
          )}
        </Row>
      </Card.Body>
    </Card>
  )
}
