import { useT } from '../i18n'

// 주소 → 누르면 지도 앱/사이트에서 그 주소를 엽니다 (복사보다 한 번에 길 찾기까지 이어져서 더 쉬움).
// 구글 지도 검색 링크를 쓰므로 4개 언어·해외 방문객 모두 같은 방식으로 열립니다.
// nested: 카드 전체가 이미 링크일 때(<a> 안에 <a> 금지) 쓰는 버전 — 같은 모양, 클릭만 직접 처리
export default function AddressLink({ addr, nested = false, className = '' }) {
  const t = useT()
  if (!addr) return null
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`

  if (nested) {
    return (
      <span role="link" tabIndex={0} className={`addr-link ${className}`} title={t('openMap')}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(url, '_blank', 'noopener,noreferrer') }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); window.open(url, '_blank', 'noopener,noreferrer') } }}>
        {addr}
      </span>
    )
  }
  return <a href={url} target="_blank" rel="noopener noreferrer" className={`addr-link ${className}`} title={t('openMap')}>{addr}</a>
}
