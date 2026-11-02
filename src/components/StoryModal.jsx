import { useEffect, useState } from 'react'
import { Badge, Button, Modal } from 'react-bootstrap'
import { fetchPlace } from '../api/client'
import { useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'
import { Loading } from './Status'
import AddressLink from './AddressLink'

// 이야기 카드를 눌렀을 때: 사진 · 이야기 · 소개 · 주소 (사진·소개·주소는 TourAPI, 없으면 이야기만)
export default function StoryModal({ story, show, onHide }) {
  const t = useT()
  const lang = useAppStore((s) => s.lang)
  const [place, setPlace] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!show) return
    setLoading(true); setPlace(null)
    fetchPlace(story.id, lang).then(setPlace).catch(() => setPlace({ found: false })).finally(() => setLoading(false))
  }, [show, story.id, lang])

  const addr = place?.addr
  // 지도 링크: 좌표(대략값) 대신 이름으로 검색해서 지도 앱이 정확한 위치를 찾게 합니다
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${story.name} ${addr || '제주'}`)}`

  return (
    <Modal show={show} onHide={onHide} centered scrollable>
      <Modal.Header closeButton closeLabel={t('close')}>
        <Modal.Title className="h5 fw-bold">{story.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && <Loading />}
        {place?.image && <img src={place.image} alt={story.name} className="w-100 rounded mb-3" style={{ maxHeight: 260, objectFit: 'cover', border: '2px solid #000' }} />}

        <div className="d-flex flex-wrap gap-1 mb-2">
          <Badge bg="light" text="dark">{story.area}</Badge>
          {story.km != null && <Badge bg="light" text="dark"><i className="bi bi-geo-alt me-1" />{story.km} km</Badge>}
        </div>

        <div className="small fw-bold text-info">{t('storyCard')}</div>
        <p>{story.story}</p>

        {place?.overview && (
          <>
            <div className="small fw-bold text-info">{t('placeIntro')}</div>
            <p style={{ whiteSpace: 'pre-line' }}>{place.overview}</p>
          </>
        )}
        {addr && <p className="mb-2"><i className="bi bi-geo-alt-fill text-primary me-1" /><b>{t('placeAddr')}</b> <AddressLink addr={addr} /></p>}
        {place && !place.found && !loading && <div className="small text-muted">{t('placeNoData')}</div>}
        {place?.found && <div className="small text-muted">{t('placeSrc')}</div>}
      </Modal.Body>
      <Modal.Footer>
        <Button as="a" href={mapUrl} target="_blank" rel="noopener noreferrer" variant="outline-dark"><i className="bi bi-map me-1" />{t('openMap')}</Button>
        <Button variant="primary" onClick={onHide}>{t('close')}</Button>
      </Modal.Footer>
    </Modal>
  )
}
