// 바람 등급 · 캠핑 적합도 규칙 (경험칙 기준 — 공식 안전 기준이 아닙니다)
// 서버(에이전트·조건 API)와 화면(src)이 같은 규칙을 쓰도록 한 곳에 둡니다.

// 풍속(m/s) → 등급
export function windGrade(ms) {
  if (!Number.isFinite(ms)) return 'unknown'
  return ms >= 10 ? 'danger' : ms >= 7 ? 'strong' : ms >= 4 ? 'breezy' : 'calm'
}

// 캠핑장 유형(normal·car·glamp·caravan) + 바람 등급 → good / caution / avoid (풍속을 모르면 null)
export function campFit(types = [], grade = 'unknown') {
  const sturdy = types.includes('glamp') || types.includes('caravan')   // 구조물이 있어 바람에 강한 편
  const car = types.includes('car')                                      // 차량을 바람막이로 활용 가능
  if (grade === 'unknown') return null                                   // 풍속을 모르면 판단하지 않음
  if (grade === 'calm') return 'good'
  if (grade === 'breezy') return sturdy || car ? 'good' : 'caution'
  if (grade === 'strong') return sturdy ? 'good' : car ? 'caution' : 'avoid'
  return sturdy ? 'caution' : 'avoid'                                    // danger
}
