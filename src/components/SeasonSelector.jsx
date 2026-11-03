import { useMemo } from 'react'
import { Card } from 'react-bootstrap'
import { SEASONS, getSeason } from '../data/seasons'
import { useT } from '../i18n'
import { useAppStore } from '../store/useAppStore'

const SEASON_BG = {
  SPRING: 'linear-gradient(135deg, rgb(240 253 244) 0%, rgb(220 252 231) 100%)',
  SUMMER: 'linear-gradient(135deg, rgb(240 249 255) 0%, rgb(207 250 254) 100%)',
  AUTUMN: 'linear-gradient(135deg, rgb(255 251 235) 0%, rgb(254 243 199) 100%)',
  WINTER: 'linear-gradient(135deg, rgb(241 245 250) 0%, rgb(219 234 254) 100%)',
}

// 4계절 선택 & 설문대할망 조언 (Stories 페이지 맨 위)
export default function SeasonSelector({ season, onSeasonChange }) {
  const t = useT()
  const lang = useAppStore((s) => s.lang)

  const seasonData = useMemo(() => getSeason(lang)(season), [season, lang])
  const currentSeason = SEASONS[season]

  // 추천 스팟 이름 (리스트는 seasons.js에서 이미 이름)
  const recommendedNames = useMemo(() => {
    return (seasonData.recommendedSpots || []).join(', ')
  }, [seasonData.recommendedSpots])

  return (
    <Card className="mb-4 border-0 shadow-sm" style={{
      backgroundImage: SEASON_BG[season],
      borderRadius: '1rem'
    }}>
      <Card.Body className="p-4">
        {/* 헤더 */}
        <div className="mb-3">
          <div className="badge bg-light text-dark mb-2" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
            🗺️ {t('seasonLabel')}
          </div>
          <h5 className="fw-black mb-0" style={{ fontSize: '1.25rem' }}>
            {currentSeason.emoji} {seasonData.name}
          </h5>
        </div>

        {/* 계절 선택 버튼 */}
        <div className="d-flex gap-2 mb-3 flex-wrap">
          {['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'].map((key) => {
            const label = key === 'SPRING' ? '🌸 봄'
              : key === 'SUMMER' ? '🌊 여름'
              : key === 'AUTUMN' ? '🌾 가을'
              : '❄️ 겨울'
            return (
              <button
                key={key}
                onClick={() => onSeasonChange(key)}
                className={`px-3 py-2 rounded-pill fw-bold border-0 transition-all ${
                  season === key
                    ? 'btn btn-dark'
                    : 'btn btn-outline-dark'
                }`}
                style={{ fontSize: '0.875rem' }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* 신화 배경 & 조언 */}
        <div className="bg-dark text-white p-3 rounded-2 position-relative overflow-hidden">
          <div className="position-absolute" style={{ right: '-1rem', bottom: '-1rem', fontSize: '4rem', opacity: 0.1 }}>
            🗿
          </div>
          <div className="position-relative" style={{ zIndex: 10 }}>
            <div className="small fw-bold text-warning mb-2">
              ✨ {t('seasonAdvice')}
            </div>
            <p className="mb-3 small" style={{ lineHeight: 1.6, fontSize: '0.95rem' }}>
              "{seasonData.myth}"
            </p>
            <div className="pt-2 border-top" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
              <div className="row">
                <div className="col-6">
                  <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>{t('seasonRecommend')}</small>
                  <small className="fw-bold text-success" style={{ fontSize: '0.875rem' }}>{recommendedNames}</small>
                </div>
                <div className="col-6 text-end">
                  <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>{t('seasonTip')}</small>
                  <small className="text-white-50" style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>{seasonData.tip}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}
