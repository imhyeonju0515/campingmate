// 직접 그린 돌하르방 캐릭터 (SVG) — mood: 'normal' | 'happy' | 'worry'
export default function Harubang({ mood = 'normal', size = 120, className = '' }) {
  const eye = (cx) => mood === 'happy'
    ? <path d={`M${cx - 6} 64 Q${cx} 57 ${cx + 6} 64`} stroke="#25272b" strokeWidth="3" fill="none" strokeLinecap="round" />
    : <><circle cx={cx} cy="62" r="7" fill="#fff" /><circle cx={cx} cy="63" r="3.5" fill="#25272b" /></>
  return (
    <svg viewBox="0 0 120 150" width={size} height={(size * 150) / 120} className={`wobble ${className}`} role="img" aria-label="돌하르방">
      {/* 몸 */}
      <path d="M30 94 Q60 86 90 94 L97 142 H23 Z" fill="#6b7280" />
      <path d="M38 100 Q60 95 82 100" stroke="#59606b" strokeWidth="2" fill="none" />
      {/* 머리 */}
      <ellipse cx="60" cy="66" rx="35" ry="31" fill="#7c8492" />
      {/* 벙거지(감투) */}
      <path d="M28 44 Q60 2 92 44 Z" fill="#4b5563" />
      <rect x="24" y="42" width="72" height="9" rx="4.5" fill="#374151" />
      {/* 얼굴 */}
      {eye(46)}{eye(74)}
      <ellipse cx="60" cy="76" rx="8" ry="5.5" fill="#59606b" />
      {mood === 'worry'
        ? <path d="M50 90 Q60 84 70 90" stroke="#25272b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        : <path d="M48 87 Q60 97 72 87" stroke="#25272b" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
      <circle cx="38" cy="78" r="4" fill="#f9a8a8" opacity="0.55" /><circle cx="82" cy="78" r="4" fill="#f9a8a8" opacity="0.55" />
      {/* 두 손 + 감귤 */}
      <ellipse cx="40" cy="116" rx="11" ry="8" fill="#7c8492" />
      <ellipse cx="80" cy="116" rx="11" ry="8" fill="#7c8492" />
      <circle cx="80" cy="108" r="10" fill="#f97316" />
      <path d="M80 98 q5 -7 10 -4 q-4 6 -10 4z" fill="#16a34a" />
    </svg>
  )
}
