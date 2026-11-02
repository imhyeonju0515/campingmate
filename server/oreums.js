// 제주 오름 목록 — 한국관광공사 TourAPI(국문 관광정보 searchKeyword2, 관광지 유형)에서 "오름"으로 모읍니다.
// 이야기 스팟(오름·화산·신화 9곳)은 직접 쓴 이야기 카드이고, 이 목록은 그보다 훨씬 많은 오름의 이름·위치·사진·주소를 공공데이터로 채웁니다.
// ※ 외국어판 TourAPI 에는 오름이 거의 없어서(영어 7개 등), 외국어 화면의 이름은 한글 이름을 로마자로 옮겨 씁니다.
import romanizePkg from '@romanize/korean';
import { cached } from './cache.js';
import { localizeAddr } from './addr.js';
const { romanize } = romanizePkg;

const URL = 'https://apis.data.go.kr/B551011/KorService2/searchKeyword2';

async function fetchOreums() {
  if (!process.env.DATA_GO_KR_KEY) return [];
  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_KEY, MobileOS: 'ETC', MobileApp: 'HarubangWindCamp', _type: 'json',
    keyword: '오름', contentTypeId: '12', numOfRows: '100', pageNo: '1',
  });
  const r = await fetch(`${URL}?${params}`);
  const item = JSON.parse(await r.text())?.response?.body?.items?.item ?? [];
  return (Array.isArray(item) ? item : [item])
    .filter((p) => /제주/.test(p.addr1 ?? '') && /오름/.test(p.title ?? '') && Number.isFinite(Number(p.mapx)) && Number.isFinite(Number(p.mapy)))
    .map((p) => ({ id: String(p.contentid), title: p.title, addr: p.addr1, lat: Number(p.mapy), lng: Number(p.mapx), image: p.firstimage || null }));
}

// 24시간 기억 (목록이 거의 안 바뀌고, 하루 요청 한도 때문)
export const getOreums = () => cached('oreums', 24 * 3600e3, fetchOreums);

const HANGUL = /[가-힣]/g;
// "가문이오름(감은이오름)" → ko: 그대로 / 그 밖: "Gamuni Oreum" (괄호 속 다른 이름은 뺌, 글자 하나씩 로마자)
export function oreumName(title, lang) {
  if (lang === 'ko') return title;
  const main = title.replace(/\s*[(（].*$/, '').replace(/오름$/, ' 오름').trim();
  return main.replace(/[가-힣]+/g, (m) => ` ${m.split('').map((c) => romanize(c)).join('').replace(/^./, (x) => x.toUpperCase())} `)
    .replace(/\s+/g, ' ').replace(/\bOreum\b|\bOrm\b|\bOreu?m\b/g, 'Oreum').trim();
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
      id: o.id, name: oreumName(o.title, lang), km: Math.round(km * 10) / 10, image: o.image,
      addr: localizeAddr(o.addr, lang), addrKo: lang === 'ko' ? undefined : o.addr,
    }));
}
