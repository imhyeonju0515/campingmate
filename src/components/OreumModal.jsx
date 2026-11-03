import { useState } from 'react'
import { Badge, Button, Modal } from 'react-bootstrap'
import StampMark from './StampMark'
import { useArea, useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'
import AddressLink from './AddressLink'
import NearCamps from './NearCamps'
import { useStamp } from '../lib/useStamp'

// 오름 카드 상세 모달 - 도장 기능 포함
export default function OreumModal({ oreum, show, onHide }) {
  const t = useT()
  const area = useArea()
  const { stamp, onStamp, locating, fresh } = useStamp(oreum, null)

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(oreum?.addrKo || oreum?.addr || `${oreum?.name} Jeju`)}`

  return (
    <Modal show={show} onHide={onHide} centered scrollable>
      <Modal.Header closeButton closeLabel={t('close')}>
        <Modal.Title className="h5 fw-bold">{oreum?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {oreum?.image && <img src={oreum.image} alt={oreum.name} className="w-100 rounded mb-3" style={{ maxHeight: 260, objectFit: 'cover', border: '2px solid #000' }} />}

        <div className="d-flex flex-wrap gap-1 mb-3">
          <Badge bg="success">{t('tag_oreum')}</Badge>
          <Badge bg="light" text="dark">{area(oreum?.area)}</Badge>
          <Badge bg="light" text="dark">{t('oreumEle')} {oreum?.elevation} m</Badge>
          <Badge bg="light" text="dark">{t('oreumRel')} {oreum?.relHeight} m</Badge>
        </div>

        {oreum?.desc && (
          <>
            <div className="small fw-bold text-info mb-2">{t('oreumInfo')}</div>
            <p>{oreum.desc}</p>
          </>
        )}

        <NearCamps camps={oreum?.camps} onNavigate={onHide} />

        {oreum?.addr && <p className="mb-3 mt-3"><i className="bi bi-geo-alt-fill text-primary me-1" /><b>{t('placeAddr')}</b> <AddressLink addr={oreum.addr} ko={oreum.addrKo} /></p>}
      </Modal.Body>
      <Modal.Footer>
        <Button as="a" href={mapUrl} target="_blank" rel="noopener noreferrer" variant="outline-dark"><i className="bi bi-map me-1" />{t('openMap')}</Button>
        {stamp
          ? <StampMark label={oreum?.name} date={stamp.at.slice(5, 10)} animate={fresh} />
          : (
            <Button variant="primary" onClick={onStamp} disabled={locating}>
              <i className={`bi bi-${locating ? 'hourglass-split' : 'geo-alt-fill'} me-1`} />{locating ? t('stampLocating') : t('stamp')}
            </Button>
          )}
        <Button variant="secondary" onClick={onHide}>{t('close')}</Button>
      </Modal.Footer>
    </Modal>
  )
}
