// 에어코리아 시도별 실시간 측정정보 (제주 측정소 평균)
const BASE = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty';

export async function getAir() {
  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_KEY, returnType: 'json',
    numOfRows: '100', pageNo: '1', sidoName: '제주', ver: '1.0',
  });
  const r = await fetch(`${BASE}?${params}`);
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error('에어코리아 응답이 JSON이 아님: ' + text.slice(0, 120)); }

  const avg = (key) => {
    const v = (data?.response?.body?.items ?? []).map((i) => Number(i[key])).filter((n) => Number.isFinite(n) && n >= 0);
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
  };
  return { pm10: avg('pm10Value'), pm25: avg('pm25Value') };
}
