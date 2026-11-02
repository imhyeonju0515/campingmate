// 한국천문연구원 출몰시각 정보(일출·일몰) + 달 위상(직접 계산)
import { XMLParser } from 'fast-xml-parser';
import { cached } from './cache.js';
const parser = new XMLParser();
const BASE = 'https://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService/getAreaRiseSetInfo';

// 달 위상: 기준 신월(2000-01-06) 로부터 경과일 / 삭망월(29.53일)
export function moonPhase(date = new Date()) {
  const synodic = 29.530588853;
  const days = (date.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
  const age = ((days % synodic) + synodic) % synodic;
  return { illumination: Math.round(((1 - Math.cos((2 * Math.PI * age) / synodic)) / 2) * 100), age: Number(age.toFixed(1)) };
}

const hhmm = (v) => { const s = String(v ?? '').trim().padStart(4, '0'); return `${s.slice(0, 2)}:${s.slice(2, 4)}`; };

// 일몰 시각은 하루에 한 번만 바뀌므로 날짜별로 기억합니다
export const getSun = ({ date } = {}) => {
  const d = date ?? new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);   // 'YYYY-MM-DD', 기본은 오늘(한국 시간)
  return cached(`sun:${d}`, 6 * 3600e3, () => fetchSun(d));
};

async function fetchSun(date) {
  const locdate = date.replaceAll('-', '');
  const params = new URLSearchParams({ serviceKey: process.env.DATA_GO_KR_KEY, locdate, location: '제주' });
  const r = await fetch(`${BASE}?${params}`);
  const it = parser.parse(await r.text())?.response?.body?.items?.item;
  if (!it) throw new Error('천문연구원 일출·일몰 응답이 비었어요');
  return { sunrise: hhmm(it.sunrise), sunset: hhmm(it.sunset) };
}
