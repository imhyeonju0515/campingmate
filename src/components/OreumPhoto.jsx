// 오름 사진. 사진이 없는 오름은 표고에 맞춘 일러스트로 대신합니다.
export default function OreumPhoto({ src, alt = '', elevation = 200, style, className = 'rounded' }) {
  const base = { width: '100%', height: 120, border: '2px solid #000', display: 'block', ...style }
  if (src) return <img src={src} alt={alt} loading="lazy" className={className} style={{ ...base, objectFit: 'cover' }} />
  const h = Math.max(28, Math.min(70, 28 + (Number(elevation) || 0) / 14))
  const top = 100 - h
  return (
    <svg role="img" aria-label={alt} viewBox="0 0 300 120" preserveAspectRatio="xMidYMid slice" className={className} style={base}>
      <rect width="300" height="120" fill="#cfeefc" />
      <circle cx="248" cy="28" r="14" fill="#ffd54a" />
      <path d={`M-10 120 L-10 92 Q60 ${top + 18} 110 ${top + 10} Q150 ${top - 6} 190 ${top + 12} Q240 ${top + 24} 310 90 L310 120 Z`} fill="#8bc34a" />
      <path d="M-10 120 L-10 106 Q80 92 160 104 Q240 114 310 100 L310 120 Z" fill="#558b2f" />
      <path d="M40 98 q5 -10 10 0 M60 100 q4 -8 8 0" stroke="#33691e" strokeWidth="2" fill="none" />
    </svg>
  )
}
