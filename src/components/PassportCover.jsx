import Harubang from './Harubang'
import StampMark from './StampMark'
import { useT } from '../i18n'

// 표지 색 (kraft 종이 · 와인 · 숲 · 남색) — bg: 표지, ink: 글자·테두리
export const COVERS = {
  kraft: { bg: '#d9b77e', ink: '#4a3418' },
  wine: { bg: '#7d2330', ink: '#f3d9a4' },
  forest: { bg: '#2f5d3a', ink: '#f3e6b3' },
  navy: { bg: '#26385f', ink: '#f3d9a4' },
}

// 여권 표지: 이름·엠블럼(돌하르방)·최근에 받은 도장 몇 개가 붙어 있습니다
export default function PassportCover({ color = 'kraft', stamps = [], names = {}, nickname }) {
  const t = useT()
  const c = COVERS[color] ?? COVERS.kraft
  const recent = [...stamps].reverse().slice(0, 3)
  const spots = [{ bottom: '5%', left: '4%', rot: -10 }, { bottom: '8%', right: '4%', rot: 8 }, { top: '3%', right: '5%', rot: 12 }]

  return (
    <div className="passport-cover" style={{ '--cover': c.bg, '--cover-ink': c.ink }}>
      <div className="passport-cover-frame" />
      <div className="passport-cover-body">
        <div className="pc-small">HARUBANG CAMPMATE</div>
        <div className="pc-title">PASSPORT</div>
        <div className="pc-emblem"><Harubang mood="happy" size={92} /></div>
        <div className="pc-journal">{t('ppJournal')}</div>
        {nickname && <div className="pc-name">{nickname}</div>}
      </div>
      {recent.map((s, i) => (
        <div key={s.spotId} className="pc-stamp" style={{ ...spots[i], transform: `rotate(${spots[i].rot}deg)` }}>
          <StampMark label={names[s.spotId] ?? s.name} date={s.at.slice(5, 10)} size={74} />
        </div>
      ))}
    </div>
  )
}
