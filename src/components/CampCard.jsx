import { Link } from 'react-router-dom'
import { Badge, Card } from 'react-bootstrap'
import { useT } from '../i18n'
import FavButton from './FavButton'
import AddressLink from './AddressLink'

const FIT_BG = { good: 'success', caution: 'warning', avoid: 'danger' }
const TYPE_KEY = { normal: 't_normal', car: 't_car', glamp: 't_glamp', caravan: 't_caravan' }

// 캠핑장 한 칸 — 목록·홈 추천에서 재사용. fit: 'good' | 'caution' | 'avoid' (오늘 바람 기준, 없으면 표시 안 함)
export default function CampCard({ camp, fit, km }) {
  const t = useT()
  return (
    <Card as={Link} to={`/camps/${encodeURIComponent(camp.id)}`} className="h-100 camp-card text-decoration-none text-body">
      {camp.image && <Card.Img variant="top" src={camp.image} alt="" loading="lazy" style={{ height: 150, objectFit: 'cover' }} />}
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="d-flex gap-1">
            <Badge bg="info">{camp.region}</Badge>
            {km != null && <Badge bg="light" text="dark"><i className="bi bi-geo-alt-fill me-1" />{km < 10 ? km.toFixed(1) : Math.round(km)} {t('kmAway')}</Badge>}
          </span>
          <span className="d-flex align-items-center gap-2">
            {fit && <Badge bg={FIT_BG[fit]}>{t(`fit_${fit}`)}</Badge>}
            <FavButton campId={camp.id} />
          </span>
        </div>
        <Card.Title className="fw-bold fs-6">{camp.name}</Card.Title>
        <div className="mb-2 d-flex flex-wrap gap-1">
          {camp.types.map((x) => <Badge key={x} bg="light" text="dark">{t(TYPE_KEY[x])}</Badge>)}
          {camp.pet && <Badge bg="light" text="dark"><i className="bi bi-heart-fill text-danger me-1" />{t('pet')}</Badge>}
          {camp.tel && <Badge bg="light" text="dark" title={t('call')}><i className="bi bi-telephone me-1" />{camp.tel}</Badge>}
          {camp.resveUrl && <Badge bg="light" text="dark" title={t('reserveNow')}><i className="bi bi-calendar-check text-success" /></Badge>}
        </div>
        <Card.Text className="small text-muted flex-grow-1">{camp.intro || <AddressLink addr={camp.addr} nested />}</Card.Text>
        {camp.stories?.length > 0 && (
          <div className="small"><i className="bi bi-signpost-2 text-primary me-1" />{camp.stories.map((s) => `${s.name} ${s.km}km`).join(' · ')}</div>
        )}
      </Card.Body>
    </Card>
  )
}
