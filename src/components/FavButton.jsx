import { useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'

// 즐겨찾기 하트. 카드 전체가 링크라서, 눌러도 상세 페이지로 넘어가지 않게 막습니다
export default function FavButton({ campId, className = '' }) {
  const t = useT()
  const on = useAppStore((s) => s.favorites.includes(campId))
  const toggleFav = useAppStore((s) => s.toggleFav)
  return (
    <button type="button" aria-pressed={on} aria-label={on ? t('favRemove') : t('favAdd')} title={on ? t('favRemove') : t('favAdd')}
      className={`fav-btn ${on ? 'on' : ''} ${className}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(campId) }}>
      <i className={`bi bi-heart${on ? '-fill' : ''}`} />
    </button>
  )
}
