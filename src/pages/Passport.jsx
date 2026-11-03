import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, ButtonGroup, Card, Col, Form, Row } from 'react-bootstrap'
import PassportCover, { COVERS } from '../components/PassportCover'
import PassportMap from '../components/PassportMap'
import StampMark from '../components/StampMark'
import { fetchStories } from '../api/client'
import { useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'

// 내 패스포트 — 표지 / 도장 / 지도 세 가지 보기. 표지 색은 고를 수 있고 브라우저에 저장됩니다.
export default function Passport() {
  const t = useT()
  const { nickname, setNickname, coverColor, setCoverColor, toast, passports, currentPassportId, switchPassport, createNewPassport, deletePassport, resetStamps, getCurrentStamps } = useAppStore()
  const lang = useAppStore((s) => s.lang)
  const [stories, setStories] = useState([])
  const [view, setView] = useState('cover')   // 'cover' | 'stamps' | 'map' | 'archive'

  const stamps = getCurrentStamps()

  useEffect(() => {
    fetchStories(lang).then(setStories).catch(() => {})
  }, [lang])

  // 도장 이름은 찍을 때의 언어로 저장돼 있어서, 지금 언어의 스토리 이름으로 바꿔 보여 줍니다
  const names = useMemo(() => Object.fromEntries(stories.map((s) => [s.id, s.name])), [stories])
  const stamped = useMemo(() => new Set(stamps.map((s) => s.spotId)), [stamps])
  const total = stories.length || 9

  const badges = [
    { key: 'b_first', on: stamps.length >= 1 },
    { key: 'b_three', on: stamps.length >= 3 },
    { key: 'b_five', on: stamps.length >= 5 },
    { key: 'b_myth', on: stamps.filter((s) => s.tag === 'myth').length >= 2 },   // 신화 스토리 2개 이상
  ]

  // 공유: 휴대폰은 공유 창, 그 밖에는 문구를 복사
  async function onShare() {
    const text = `${t('brand')} · ${t('passportTitle')} ${stamps.length} / ${total} ${t('ppSpots')}`
    try {
      if (navigator.share) await navigator.share({ title: t('brand'), text, url: location.origin })
      else { await navigator.clipboard.writeText(`${text} ${location.origin}`); toast(t('ppShared')) }
    } catch { /* 공유 창을 닫은 경우 등 */ }
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-start mb-3 gap-2">
        <div>
          <h2 className="fw-bold mb-0">{t('passportTitle')}</h2>
          <div className="text-muted">{stamps.length} / {total} {t('ppSpots')}</div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button variant="outline-dark" size="sm" onClick={onShare}><i className="bi bi-box-arrow-up me-1" />{t('ppShare')}</Button>
          <span className="pp-avatar" aria-hidden="true">{(nickname || '🗿').slice(0, 1).toUpperCase()}</span>
        </div>
      </div>

      <Form.Control className="mb-3" style={{ maxWidth: 320 }} placeholder={t('nickname')} value={nickname} onChange={(e) => setNickname(e.target.value)} />

      <ButtonGroup className="mb-4">
        {[['cover', 'ppCover', 'journal-bookmark'], ['stamps', 'ppStamps', 'patch-check'], ['map', 'ppMap', 'map'], ...(passports.length > 0 ? [['archive', 'ppArchive', 'archive']] : [])].map(([k, label, icon]) => (
          <Button key={k} variant={view === k ? 'dark' : 'outline-dark'} onClick={() => setView(k)} aria-pressed={view === k}>
            <i className={`bi bi-${icon} me-1`} />{t(label)}
          </Button>
        ))}
      </ButtonGroup>

      {view === 'cover' && (
        <div className="mb-4 text-center">
          <PassportCover color={coverColor} stamps={stamps} names={names} nickname={nickname} />
          <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
            <span className="small text-muted">{t('ppCoverColor')}</span>
            {Object.entries(COVERS).map(([k, c]) => (
              <button key={k} type="button" className={`cover-swatch ${coverColor === k ? 'on' : ''}`} style={{ background: c.bg }}
                aria-label={`${t('ppCoverColor')}: ${k}`} aria-pressed={coverColor === k} onClick={() => setCoverColor(k)} />
            ))}
          </div>
          <Link to="/stories" className="btn btn-primary btn-lg mt-3"><i className="bi bi-plus-lg me-1" />{t('ppGoStamp')}</Link>
        </div>
      )}

      {view === 'stamps' && (
        <Card className="mb-4"><Card.Body>
          <Row xs={3} sm={4} md={5} className="g-4 justify-content-center">
            {(stories.length ? stories : []).map((s) => {
              const st = stamps.find((x) => x.spotId === s.id)
              return (
                <Col key={s.id} className="d-flex flex-column align-items-center gap-1 text-center">
                  {st
                    ? <StampMark label={s.name} date={st.at.slice(5, 10)} />
                    : <Link to="/stories" className="stamp-empty" title={t('ppLocked')}><i className="bi bi-lock" /></Link>}
                  {!st && <span className="small text-muted">{s.name}</span>}
                </Col>
              )
            })}
          </Row>
        </Card.Body></Card>
      )}

      {view === 'map' && <Card className="mb-4"><Card.Body><PassportMap stories={stories} stamped={stamped} /></Card.Body></Card>}

      {view === 'archive' && (
        <>
          <h5 className="fw-bold mb-3"><i className="bi bi-archive me-2" />{t('ppArchive')}</h5>
          {passports.length === 0 ? (
            <div className="text-center text-muted mb-4">
              <p>{t('ppNoArchive')}</p>
            </div>
          ) : (
            <Row xs={1} md={2} className="g-3 mb-4">
              {passports.map((pp, idx) => {
                const createdDate = new Date(pp.createdAt)
                const isActive = pp.id === currentPassportId
                return (
                  <Col key={pp.id}>
                    <Card className={`h-100 ${isActive ? 'border-primary' : ''}`} style={isActive ? { borderWidth: 2 } : {}}>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <Card.Title className="fw-bold small mb-1">#{passports.length - idx}</Card.Title>
                            <Card.Subtitle className="text-muted small">{createdDate.toLocaleDateString(lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : 'ko-KR')}</Card.Subtitle>
                          </div>
                          {isActive && <Badge bg="primary">{t('current')}</Badge>}
                        </div>
                        <div className="mb-3">
                          <div className="fw-bold small text-muted">{t('ppSpots')}</div>
                          <div className="fs-5">{pp.stamps.length} / {stories.length || 9}</div>
                        </div>
                        <div className="d-flex gap-2">
                          {!isActive && (
                            <Button size="sm" variant="outline-primary" onClick={() => switchPassport(pp.id)} className="flex-fill">
                              <i className="bi bi-arrow-left me-1" />{t('switch')}
                            </Button>
                          )}
                          <Button size="sm" variant="outline-danger" onClick={() => deletePassport(pp.id)} className="flex-fill">
                            <i className="bi bi-trash me-1" />{t('delete')}
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                )
              })}
            </Row>
          )}
        </>
      )}

      {view === 'cover' && stamps.length >= 7 && (
        <div className="alert alert-success d-flex justify-content-between align-items-center mb-4">
          <div>
            <i className="bi bi-star-fill me-2 text-warning" />
            <strong>{t('ppFull')}</strong>
          </div>
          <Button size="sm" variant="success" onClick={createNewPassport}>
            <i className="bi bi-plus-lg me-1" />{t('ppCreateNew')}
          </Button>
        </div>
      )}

      <h5 className="fw-bold mb-3"><i className="bi bi-award text-primary me-2" />{t('badges')}</h5>
      <Row xs={2} md={4} className="g-3 mb-3">
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

      {stamps.length > 0 && (
        <button className="btn btn-link btn-sm text-muted" onClick={resetStamps}><i className="bi bi-trash me-1" />{t('reset')}</button>
      )}
    </>
  )
}
