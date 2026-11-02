import { Card, Col, Form, Row } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import StampMark from '../components/StampMark'
import { Empty } from '../components/Status'
import { useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'

// 내 패스포트 — store 의 stamps 와 배지를 보여줍니다
export default function Passport() {
  const t = useT()
  const { nickname, setNickname, stamps, resetStamps } = useAppStore()

  const badges = [
    { key: 'b_first', on: stamps.length >= 1 },
    { key: 'b_three', on: stamps.length >= 3 },
    { key: 'b_five', on: stamps.length >= 5 },
    { key: 'b_myth', on: stamps.filter((s) => s.tag === 'myth').length >= 2 },   // 신화 스토리 2개 이상
  ]

  return (
    <>
      <PageHeader icon="journal-bookmark" title={t('passportTitle')} />
      <Form.Control className="mb-4" style={{ maxWidth: 320 }} placeholder={t('nickname')}
        value={nickname} onChange={(e) => setNickname(e.target.value)} />

      <h5 className="fw-bold mb-3"><i className="bi bi-award text-primary me-2" />{t('badges')}</h5>
      <Row xs={2} md={4} className="g-3 mb-4">
        {badges.map((b) => (
          <Col key={b.key}>
            <Card className="h-100 text-center" style={b.on ? undefined : { opacity: 0.4, filter: 'grayscale(1)' }}>
              <Card.Body>
                <div className="fs-1">{b.on ? '🏅' : '🔒'}</div>
                <div className="fw-bold small">{t(b.key)}</div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">{t('progress')} · {stamps.length}</h5>
        {stamps.length > 0 && (
          <button className="btn btn-link btn-sm text-muted" onClick={resetStamps}><i className="bi bi-trash me-1" />{t('reset')}</button>
        )}
      </div>
      {stamps.length === 0 ? <Empty text={t('noStamps')} /> : (
        <Card><Card.Body>
          <Row xs={3} sm={4} md={5} className="g-4 justify-content-center">
            {stamps.map((s) => (
              <Col key={s.spotId} className="d-flex justify-content-center"><StampMark label={s.name} date={s.at.slice(5, 10)} /></Col>
            ))}
          </Row>
        </Card.Body></Card>
      )}
    </>
  )
}
