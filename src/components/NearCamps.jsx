import { Link } from 'react-router-dom'
import { Badge } from 'react-bootstrap'
import { useArea, useT } from '../i18n'

// 스팟(오름·화산·신화) 근처 캠핑장: 이름을 누르면 캠핑장 상세로. 거리는 직선거리(이동 시간 데이터는 없음)
export default function NearCamps({ camps = [], onNavigate, compact = false }) {
  const t = useT()
  const area = useArea()
  if (!camps.length) return null
  return (
    <div className={compact ? 'small mt-2' : 'mt-3'}>
      <div className="fw-bold mb-1"><i className="bi bi-tree text-primary me-1" />{t('nearCamps')} <span className="small fw-normal text-muted">({t('straightNote')})</span></div>
      <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
        {camps.map((c) => (
          <li key={c.id}>
            <Link to={`/camps/${encodeURIComponent(c.id)}`} onClick={onNavigate} className="text-body fw-semibold">{c.name}</Link>
            <Badge bg="info" className="ms-1">{area(c.region)}</Badge>
            <span className="ms-1 text-muted"><i className="bi bi-geo-alt-fill" /> {c.km} km</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
