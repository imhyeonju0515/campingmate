import { Link } from 'react-router-dom'
import { COAST_LATLNG } from '../lib/jejuCoast'
import { useT } from '../i18n'

// 패스포트 미니 지도: 이야기 스팟 9곳을 제주 윤곽 위에 점으로 찍고, 도장을 받은 곳은 채워서 보여 줍니다.
// 윤곽·좌표는 대략값이라 위치 안내용이 아니라 "얼마나 모았나"를 보여 주는 그림입니다.
const W = 420, H = 300, LAT0 = 33.12, LAT1 = 33.62, LNG0 = 126.10, LNG1 = 127.0
const px = (lng) => ((lng - LNG0) / (LNG1 - LNG0)) * W
const py = (lat) => H - ((lat - LAT0) / (LAT1 - LAT0)) * H

export default function PassportMap({ stories, stamped }) {
  const t = useT()
  const outline = COAST_LATLNG.map(([la, lo]) => `${px(lo).toFixed(1)},${py(la).toFixed(1)}`).join(' ')
  const done = stories.filter((s) => stamped.has(s.id)).length
  const pct = stories.length ? Math.round((done / stories.length) * 100) : 0

  return (
    <div className="passport-map">
      <div className="fw-bold mb-2">{done} / {stories.length} {t('ppSpots')} <span className="text-muted fw-normal">({pct}%)</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-100" role="img" aria-label={t('ppMap')}>
        <polygon points={outline} fill="var(--lime-soft)" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
        {stories.map((s) => {
          const on = stamped.has(s.id)
          return (
            <g key={s.id}>
              <circle cx={px(s.lng)} cy={py(s.lat)} r={on ? 9 : 7} fill={on ? 'var(--brand)' : '#fff'} stroke="#000" strokeWidth="2.5" strokeDasharray={on ? undefined : '3 2'} />
              {on && <text x={px(s.lng)} y={py(s.lat) - 13} textAnchor="middle" fontSize="11" fontWeight="700" fill="#000"
                stroke="#fffef6" strokeWidth="3" paintOrder="stroke">{s.name}</text>}
            </g>
          )
        })}
      </svg>
      {done < stories.length && <Link to="/stories" className="btn btn-primary mt-2"><i className="bi bi-geo-alt-fill me-1" />{t('ppGoStamp')}</Link>}
    </div>
  )
}
