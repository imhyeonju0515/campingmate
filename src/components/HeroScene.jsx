import Harubang from './Harubang'

// 홈 맨 위 장면: 종이 질감 하늘 · 크레용 구름 · 초록 한라산 · 산 위에서 캠핑하는 돌하르방과 텐트 · 아래쪽 바다
// 전부 SVG·CSS 로 직접 그린 단순한 그림이고, 움직임은 theme.css 의 hero-* 애니메이션입니다(움직임 줄이기 설정이면 멈춘 그림).
const CLOUD = 'M20 62 C6 62 4 44 20 42 C18 24 40 18 52 28 C58 10 86 8 96 26 C112 16 134 26 130 44 C150 44 154 62 134 62 Z'
const CLOUDS = [
  { top: '3%', left: '3%', w: 30, dur: 18, delay: 0 },
  { top: '22%', left: '66%', w: 34, dur: 22, delay: -6 },
  { top: '34%', left: '6%', w: 22, dur: 16, delay: -3 },
]

// 한라산 (viewBox 480 x 240): 윗면이 평평한 방패 모양. 산마루 y=64 가 하르방이 서는 바닥(theme.css 의 hero-stage 위치와 맞춤)
const MOUNTAIN = 'M-10 240 L-10 196 C30 190 70 168 110 130 C135 106 150 76 176 68 L322 64 C346 70 362 98 396 126 C434 158 452 180 490 190 L490 240 Z'
const RIDGE = 'M-10 196 C30 190 70 168 110 130 C135 106 150 76 176 68 L322 64 C346 70 362 98 396 126 C434 158 452 180 490 190'
const LOWER = 'M-10 240 L-10 214 C60 202 120 176 190 166 C250 160 330 164 400 178 C440 186 470 196 490 204 L490 240 Z'
const TOP = 'M176 68 L322 64 C336 68 346 76 352 84 C300 94 200 94 138 86 C148 78 160 71 176 68 Z'
const TREES = [[104, 150, 11], [132, 168, 9], [64, 190, 10], [388, 148, 11], [414, 170, 9], [452, 192, 10], [340, 120, 8]]

export default function HeroScene({ mood = 'normal', say, title }) {
  return (
    <div className="hero-scene">
      {/* 손으로 그린 듯 울퉁불퉁한 선(crayon)과 종이 질감(paper) 필터 */}
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
        <defs>
          <filter id="hs-crayon" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" />
          </filter>
          <filter id="hs-paper">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0.55 0" />
          </filter>
          <pattern id="hs-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
            <line x1="0" y1="0" x2="0" y2="9" stroke="#2c7a38" strokeWidth="1.6" opacity=".55" />
          </pattern>
        </defs>
      </svg>

      <div className="hero-sky" />

      {CLOUDS.map((c, i) => (
        <div key={i} className="hero-cloud" style={{ top: c.top, left: c.left, width: `${c.w}%`, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}>
          <svg viewBox="0 0 160 80" width="100%" aria-hidden="true">
            <path d={CLOUD} fill="#fff" stroke="#7bb8ec" strokeWidth="4" strokeLinejoin="round" filter="url(#hs-crayon)" />
          </svg>
        </div>
      ))}

      {/* 한라산: 윤곽선이 그려진 뒤 초록색이 번져 들어옴 */}
      <svg className="hero-mountain" viewBox="0 0 480 240" preserveAspectRatio="none" aria-hidden="true">
        <g className="hero-fill">
          <path d={MOUNTAIN} fill="#62b650" />
          <path d={LOWER} fill="#3f9a45" />
          <path d={LOWER} fill="url(#hs-hatch)" />
          <path d={TOP} fill="#93d56e" />
        </g>
        <g filter="url(#hs-crayon)">
          <g className="hero-fill">
            {TREES.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#2f8a3d" stroke="#1e3a24" strokeWidth="1.8" />)}
          </g>
          <path pathLength="1" className="hero-draw" d={RIDGE} fill="none" stroke="#1e3a24" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>

      {/* 산마루의 돌하르방 + 캠핑 텐트 */}
      <div className="hero-stage">
        <div className="hero-harubang"><Harubang mood={mood} size={120} /></div>
      </div>
      <svg className="hero-tent" viewBox="0 0 60 56" aria-hidden="true">
        <g filter="url(#hs-crayon)" stroke="#2b2b2b" strokeWidth="2.4" strokeLinejoin="round">
          <path d="M30 6 L56 50 H4 Z" fill="#f6a43a" />
          <path d="M30 22 L42 50 H18 Z" fill="#c9701d" />
          <path d="M30 6 V0" fill="none" />
          <path className="hero-flag" d="M30 1 L40 4 L30 8 Z" fill="#d94a4a" />
        </g>
      </svg>

      <div className="hero-sea">
        <svg className="hero-waves" viewBox="0 0 800 60" preserveAspectRatio="none" aria-hidden="true">
          <g fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".85">
            <path d="M0 18 q25 -10 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0" />
            <path d="M0 44 q20 -8 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" opacity=".6" />
          </g>
        </svg>
      </div>

      <div className="hero-title">
        <div className="hero-kicker">JEJU CAMPMATE</div>
        <h1>{title}</h1>
      </div>

      {say && <div className="bubble hero-bubble">{say}</div>}

      <svg className="hero-paper" width="100%" height="100%" aria-hidden="true"><rect width="100%" height="100%" filter="url(#hs-paper)" /></svg>
    </div>
  )
}
