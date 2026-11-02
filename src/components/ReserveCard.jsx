import { Badge, Button, Card } from 'react-bootstrap'
import { useT } from '../i18n'

// 고캠핑이 알려 주는 예약 방식 → i18n 키 (모르는 값은 원문 그대로 표시)
const METHOD_KEY = { 온라인실시간예약: 'r_online', 전화: 'r_phone', 온라인예약대기: 'r_wait', 현장: 'r_onsite' }

// 캠핑장 예약·문의 카드: 전화 걸기 / 온라인 예약 / 홈페이지. 값이 없으면 없다고 솔직하게 알려 줍니다.
export default function ReserveCard({ camp }) {
  const t = useT()
  const { tel, resveUrl, homepage, reserve = [] } = camp
  const hasAny = tel || resveUrl || homepage || reserve.length > 0

  return (
    <Card className="mb-4">
      <Card.Body>
        <h5 className="fw-bold mb-3"><i className="bi bi-calendar-check text-primary me-2" />{t('reserveTitle')}</h5>
        {!hasAny && <div className="text-muted small">{t('noContact')}</div>}

        {reserve.length > 0 && (
          <div className="mb-3">
            <span className="small text-muted me-2">{t('reserveMethod')}</span>
            {reserve.map((m) => <Badge key={m} bg="info" className="me-1">{METHOD_KEY[m] ? t(METHOD_KEY[m]) : m}</Badge>)}
          </div>
        )}

        <div className="d-flex flex-wrap gap-2">
          {/* tel: 링크에는 숫자·+ 만 넣습니다 */}
          {tel && <Button href={`tel:${tel.replace(/[^\d+]/g, '')}`} variant="primary"><i className="bi bi-telephone me-1" />{t('call')} · {tel}</Button>}
          {resveUrl && <Button href={resveUrl} target="_blank" rel="noopener noreferrer" variant="warning" className="fw-bold"><i className="bi bi-box-arrow-up-right me-1" />{t('reserveNow')}</Button>}
          {homepage && <Button href={homepage} target="_blank" rel="noopener noreferrer" variant="outline-dark"><i className="bi bi-house me-1" />{t('homepage')}</Button>}
        </div>

        {hasAny && <div className="small text-muted mt-3"><i className="bi bi-info-circle me-1" />{t('reserveNote')}</div>}
      </Card.Body>
    </Card>
  )
}
