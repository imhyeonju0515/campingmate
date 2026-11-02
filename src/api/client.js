// React 화면이 우리 서버 함수(/api/...)를 부를 때 쓰는 함수 모음
// 공공데이터 API를 브라우저에서 직접 부르지 않습니다 (키 노출 + CORS 문제) → 반드시 /api 를 거칩니다.

// 응답을 JSON으로 읽고, 실패하면 에러를 던집니다
async function readJson(r) {
  let data
  try { data = await r.json() }
  catch { throw new Error(`서버 응답이 JSON이 아님 (${r.status}) — vercel dev 로 실행했는지 확인`) }
  if (!r.ok) throw new Error(data.error || r.statusText)
  return data
}

export async function get(path) {
  return readJson(await fetch(path))
}

export async function post(path, body) {
  return readJson(await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }))
}

// 동작 확인용
export const ping = () => get('/api/hello')

// 캠핑장 (고캠핑) · 상세 (+근처 스토리, TourAPI 주변 장소)
export const fetchCamps = ({ lang = 'ko', keyword = '', type = '', region = '' } = {}) =>
  get(`/api/camps?lang=${lang}&keyword=${encodeURIComponent(keyword)}&type=${type}&region=${encodeURIComponent(region)}`)
export const fetchCamp = (id, lang = 'ko') => get(`/api/camps?id=${encodeURIComponent(id)}&lang=${lang}`)

// 오름·신화 스토리
export const fetchPlace = (id, lang = 'ko') => get(`/api/place?id=${encodeURIComponent(id)}&lang=${lang}`)
export const fetchStories = (lang = 'ko', tag = '') => get(`/api/stories?lang=${lang}&tag=${tag}`)

// 캠핑 컨디션 (기상청 + 에어코리아 + 천문연구원) · 국가유산 (국가유산청)
export const fetchCondition = (place = '제주시') => get(`/api/condition?place=${encodeURIComponent(place)}`)
export const fetchForecast = (place = '제주시') => get(`/api/forecast?place=${encodeURIComponent(place)}`)
export const fetchHeritage = (keyword = '') => get(`/api/heritage?keyword=${encodeURIComponent(keyword)}`)

// 에이전트
export const askAgent = (message, history, lang) => post('/api/agent', { message, history, lang })
