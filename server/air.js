// 에어코리아 시도별 실시간 측정정보 (제주 측정소 평균)
import { cached } from './cache.js';
const BASE = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty';

export const getAir = () => cached('air', 30 * 60e3, fetchAir);   // 측정값은 1시간마다 갱신 → 30분 기억

async function fetchAir() {
  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_KEY, returnType: 'json',
    numOfRows: '100', pageNo: '1', sidoName: '제주', ver: '1.0',
  });
  const r = await fetch(`${BASE}?${params}`);
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error('에어코리아 응답이 JSON이 아님: ' + text.slice(0, 120)); }

  // 한도 초과·키 오류 등은 body 없이 에러 메시지만 옵니다 — 값이 비어 "-" 로만 보이지 않도록 이유와 함께 에러로 냅니다
  if (!data?.response?.body) {
    const h = data?.OpenAPI_ServiceResponse?.cmmMsgHeader;
    throw new Error(`에어코리아: ${h?.returnAuthMsg ?? h?.errMsg ?? '응답 형식이 달라요'}`);
  }

  const avg = (key) => {
    const v = (data.response.body.items ?? []).map((i) => Number(i[key])).filter((n) => Number.isFinite(n) && n >= 0);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
  };
  return { pm10: avg('pm10Value'), pm25: avg('pm25Value') };
}
