// 제주 오름 90개 — 제주특별자치도 "제주오름요약설명"(공공데이터포털 15096996, 기준일 2021-11-30)이 기본 자료입니다.
// 이름·위치·표고·비고(오름 자체 높이)·좌표·설명은 그 CSV(server/data/source → scripts/build-oreums.mjs → oreums.json)에서,
// 사진과 자세한 주소는 한국관광공사 TourAPI 관광지 목록에서 이름이 같은 것을 찾아 붙입니다(없으면 사진 없음).
// 설명은 한국어뿐이라 외국어 화면에는 숫자(표고·비고)와 위치만 보여 줍니다. 오름 소요시간·난이도는 이 자료에 없습니다.
import { cached } from './cache.js';
import { localizeAddr } from './addr.js';
import BASE from './data/oreums.json' with { type: 'json' };   // 정적 import 라서 Vercel 이 함수에 파일을 확실히 포함시킴

// TourAPI 목록에서 사진·주소 가져오기 (실패하면 빈 목록 — 그래도 오름 정보는 나옴)
async function fetchTourImages() {
  if (!process.env.DATA_GO_KR_KEY) return new Map();
  try {
    const params = new URLSearchParams({
      serviceKey: process.env.DATA_GO_KR_KEY, MobileOS: 'ETC', MobileApp: 'HarubangWindCamp', _type: 'json',
      keyword: '오름', contentTypeId: '12', numOfRows: '100', pageNo: '1',
    });
    const r = await fetch(`https://apis.data.go.kr/B551011/KorService2/searchKeyword2?${params}`);
    const item = JSON.parse(await r.text())?.response?.body?.items?.item ?? [];
    return new Map((Array.isArray(item) ? item : [item]).filter((p) => /제주/.test(p.addr1 ?? '')).map((p) => [key(p.title), { image: p.firstimage || null, addr: p.addr1 }]));
  } catch { return new Map(); }
}
// 이름 비교용: 괄호 속 다른 이름·"오름"·공백을 뺀 것
const key = (s = '') => s.replace(/\s*[(（].*$/, '').replace(/오름/g, '').replace(/\s+/g, '');

// 24시간 기억 (하루 요청 한도 때문)
export const getOreums = () => cached('oreums', 24 * 3600e3, async () => {
  const tour = await fetchTourImages();
  return BASE.map((o) => {
    const t = tour.get(key(o.ko));
    return { ...o, image: t?.image ?? null, addr: t?.addr ?? `제주특별자치도 ${o.loc}` };
  });
});

// "abu" → "Abu Oreum" (CSV 의 영문명에 오름 글자가 없으면 붙임)
export function oreumName(o, lang) {
  if (lang === 'ko') return o.ko;
  const en = o.en.replace(/^./, (c) => c.toUpperCase());
  return o.ko.endsWith('오름') && !/oreum$/i.test(en) ? `${en} Oreum` : en;
}

const rad = (d) => (d * Math.PI) / 180;
const distKm = (aLat, aLng, bLat, bLng) => 12742 * Math.asin(Math.sqrt(
  Math.sin(rad(bLat - aLat) / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLng - aLng) / 2) ** 2));

// 한 지점(캠핑장)에서 가까운 오름 n개 — 거리는 직선거리(km)
export async function oreumsNear(lat, lng, lang = 'ko', n = 5) {
  const all = await getOreums();
  return all
    .map((o) => ({ o, km: distKm(lat, lng, o.lat, o.lng) }))
    .sort((a, b) => a.km - b.km).slice(0, n)
    .map(({ o, km }) => ({
      id: o.id, name: oreumName(o, lang), km: Math.round(km * 10) / 10, image: o.image,
      elevation: o.ele, relHeight: o.rel,                 // 표고(m) · 비고(오름 자체 높이, m)
      desc: lang === 'ko' ? o.desc : undefined,           // 설명은 한국어뿐
      addr: localizeAddr(o.addr, lang), addrKo: lang === 'ko' ? undefined : o.addr,
    }));
}
