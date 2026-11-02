// 여권에 찍힌 도장 모양 (animate=true 면 찍히는 애니메이션)
export default function StampMark({ label, date, animate = false, size = 84 }) {
  return (
    <div className={`stamp-mark ${animate ? 'stamp-pop' : ''}`} style={{ width: size, height: size }}>
      <span className="px-1" style={{ fontSize: 10 }}>{label}</span>
      {date && <span style={{ fontSize: 9, opacity: 0.8 }}>{date}</span>}
    </div>
  )
}
