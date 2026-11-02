// 기상청 단기예보 조회서비스 (VilageFcstInfoService_2.0)
import { cached } from './cache.js';
const BASE = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';
const GRID = { '제주시': [53, 38], '서귀포시': [52, 33] }; // 기상청 격자 좌표(nx, ny)
const SKY = { 1: '맑음', 3: '구름많음', 4: '흐림' };
const PTY = { 0: '없음', 1: '비', 2: '비/눈', 3: '눈', 4: '소나기' };
const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

// 발표시각: 02·05·08·11·14·17·20·23시 (발표 후 약 10분 뒤부터 조회 가능)
function baseDateTime() {
  const kst = new Date(Date.now() + 9 * 3600e3 - 15 * 60e3);
  let h = [23, 20, 17, 14, 11, 8, 5, 2].find((x) => x <= kst.getUTCHours());
  let day = kst;
  if (h === undefined) { day = new Date(kst.getTime() - 24 * 3600e3); h = 23; }
  return {
    base_date: day.toISOString().slice(0, 10).replaceAll('-', ''),
    base_time: String(h).padStart(2, '0') + '00',
  };
}

// 시간대별 예보를 { 'YYYYMMDD HHMM': { TMP, WSD, ... } } 로 모읍니다 (rows: 가져올 행 수 — 3일치는 1000 정도)
// 예보는 3시간마다 갱신되므로 10분 기억 (발표시각이 바뀌면 키가 달라져 새로 받습니다)
const fetchSlots = (place, rows) => cached(`wx:${place}:${rows}:${JSON.stringify(baseDateTime())}`, 10 * 60e3, () => loadSlots(place, rows));

async function loadSlots(place, rows) {
  const [nx, ny] = GRID[place] ?? GRID['제주시'];
  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_KEY,
    dataType: 'JSON', numOfRows: String(rows), pageNo: '1',
    nx: String(nx), ny: String(ny), ...baseDateTime(),
  });
  const r = await fetch(`${BASE}?${params}`);
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error('기상청 응답이 JSON이 아님: ' + text.slice(0, 120)); }

  const items = data?.response?.body?.items?.item ?? [];
  const slots = {};
  for (const it of items) {
    const key = `${it.fcstDate} ${it.fcstTime}`;
    (slots[key] ??= {})[it.category] = it.fcstValue;
  }
  return slots;
}

export async function getWeather({ place = '제주시' } = {}) {
  const slots = await fetchSlots(place, 300);
  // 이미 지난 시간대는 빼고 "지금 이후" 예보부터 6칸 (발표 시각 기준 첫 칸은 몇 시간 전일 수 있음)
  const k = new Date(Date.now() + 9 * 3600e3).toISOString()
  const nowKey = `${k.slice(0, 10).replaceAll('-', '')} ${k.slice(11, 13)}00`
  const all = Object.entries(slots)
  const upcoming = all.filter(([time]) => time >= nowKey)
  return (upcoming.length ? upcoming : all).slice(0, 6).map(([time, v]) => ({
    place, time, temp: Number(v.TMP), sky: SKY[v.SKY] ?? v.SKY,
    rain: PTY[v.PTY] ?? v.PTY, pop: Number(v.POP),
    skyCode: Number(v.SKY), ptyCode: Number(v.PTY),                          // 화면이 언어에 맞게 번역할 코드
    wind: Number(v.WSD),                                                   // 풍속 m/s
    vec: Number(v.VEC),                                                    // 풍향(바람이 불어오는 방향, 도)
    dir: COMPASS[Math.round((Number(v.VEC) % 360) / 22.5) % 16],
  }));
}

// 날짜별 요약 (오늘부터 최대 3일): 풍속은 그날 가장 센 시간대 기준 — 텐트는 순간적인 강풍에 약하므로
export async function getForecast({ place = '제주시' } = {}) {
  const slots = await fetchSlots(place, 1000);
  const days = {};
  for (const [time, v] of Object.entries(slots)) {
    const d = time.slice(0, 8);
    (days[d] ??= []).push(v);
  }
  return Object.entries(days).slice(0, 3).map(([d, list]) => {
    const winds = list.map((v) => Number(v.WSD)).filter(Number.isFinite);
    const temps = list.map((v) => Number(v.TMP)).filter(Number.isFinite);
    const vecs = list.map((v) => Number(v.VEC)).filter(Number.isFinite);
    const peak = winds.length ? winds.indexOf(Math.max(...winds)) : -1;
    const windMax = winds.length ? Math.max(...winds) : null;
    return {
      place, date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`,
      windMax, windAvg: winds.length ? Math.round((winds.reduce((a, b) => a + b, 0) / winds.length) * 10) / 10 : null,
      dir: peak >= 0 && vecs[peak] != null ? COMPASS[Math.round((vecs[peak] % 360) / 22.5) % 16] : null,
      popMax: Math.max(0, ...list.map((v) => Number(v.POP)).filter(Number.isFinite)),
      rain: list.some((v) => Number(v.PTY) > 0),
      tempMin: temps.length ? Math.min(...temps) : null, tempMax: temps.length ? Math.max(...temps) : null,
      hours: list.length,   // 예보가 일부 시간대만 있으면(오늘 남은 시간·3일째 끝) 작게 나옵니다
    };
  });
}
