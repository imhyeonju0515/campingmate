// 캠핑장 목록 + 근처 오름·신화 스토리 + 주변 장소
// - DATA_GO_KR_KEY 가 있으면 한국관광공사 고캠핑(GoCamping) API 에서 제주 야영장을 가져옵니다.
// - 키가 없거나 응답이 비면 샘플(가상) 캠핑장으로 대체합니다.
import { SAMPLE_CAMPS } from './data/camps.js';
import { STORIES, pick } from './data/stories.js';

const GOCAMPING = 'https://apis.data.go.kr/B551011/GoCamping/basedList';
const TOUR = 'https://apis.data.go.kr/B551011';
const TOUR_SERVICE = { ko: 'KorService2', en: 'EngService2', zh: 'ChsService2', ja: 'JpnService2' };

// 고캠핑 induty("일반야영장,자동차야영장,글램핑,카라반") → 유형 코드
const typesOf = (induty = '') => [
  /일반야영/.test(induty) && 'normal', /자동차야영/.test(induty) && 'car',
  /글램핑/.test(induty) && 'glamp', /카라반/.test(induty) && 'caravan',
].filter(Boolean);

let cache = { at: 0, list: null };   // 고캠핑은 한 번에 많이 받아 오므로 1시간 캐시

async function fetchLive() {
  if (!process.env.DATA_GO_KR_KEY) return null;
  if (cache.list && Date.now() - cache.at < 3600e3) return cache.list;
  try {
    const params = new URLSearchParams({
      serviceKey: process.env.DATA_GO_KR_KEY, MobileOS: 'ETC', MobileApp: 'HarubangWindCamp',
      _type: 'json', numOfRows: '4000', pageNo: '1',
    });
    const r = await fetch(`${GOCAMPING}?${params}`);
    const item = JSON.parse(await r.text())?.response?.body?.items?.item ?? [];
    const list = (Array.isArray(item) ? item : [item])
      .filter((c) => /제주/.test(`${c.doNm ?? ''}${c.addr1 ?? ''}`))
      .map((c) => ({
        id: String(c.contentId), name: c.facltNm, intro: c.lineIntro || (c.intro ?? '').slice(0, 120),
        addr: c.addr1, tel: c.tel, homepage: c.homepage, image: c.firstImageUrl,
        region: /서귀포/.test(`${c.sigunguNm ?? ''}${c.addr1 ?? ''}`) ? '서귀포시' : '제주시',
        types: typesOf(c.induty), pet: Boolean(c.animalCmgCl) && !/불가/.test(c.animalCmgCl),
        lat: Number(c.mapY), lng: Number(c.mapX), source: 'gocamping',
      }))
      .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng));
    if (list.length) cache = { at: Date.now(), list };
    return list.length ? list : null;
  } catch { return null; }
}

async function allCamps(lang) {
  const live = await fetchLive();
  if (live) return live;
  return SAMPLE_CAMPS.map((c) => ({
    ...c, name: pick(c.name, lang), intro: pick(c.intro, lang), source: 'sample',
  }));
}

const rad = (d) => (d * Math.PI) / 180;
function distKm(aLat, aLng, bLat, bLng) {
  const h = Math.sin(rad(bLat - aLat) / 2) ** 2
    + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLng - aLng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

const shapeStory = (s, lang, km) => ({
  id: s.id, area: s.area, tag: s.tag, lat: s.lat, lng: s.lng, keyword: s.keyword,
  name: pick(s.name, lang), story: pick(s.story, lang), ...(km != null && { km }),
});

export function listStories({ lang = 'ko', tag = '', area = '' } = {}) {
  return STORIES.filter((s) => (!tag || s.tag === tag) && (!area || s.area === area)).map((s) => shapeStory(s, lang));
}

// 캠핑장에서 가까운 순으로 오름·신화 스토리 n개
function storiesNear(c, lang, n) {
  return STORIES
    .map((s) => ({ s, km: distKm(c.lat, c.lng, s.lat, s.lng) }))
    .sort((a, b) => a.km - b.km).slice(0, n)
    .map(({ s, km }) => shapeStory(s, lang, Math.round(km * 10) / 10));
}

export async function listCamps({ lang = 'ko', keyword = '', type = '', region = '' } = {}) {
  const kw = keyword.trim().toLowerCase();
  return (await allCamps(lang))
    .filter((c) => (!type || c.types.includes(type)) && (!region || c.region === region)
      && (!kw || `${c.name} ${c.intro ?? ''} ${c.addr ?? ''}`.toLowerCase().includes(kw)))
    .map((c) => ({ ...c, stories: storiesNear(c, lang, 2).map(({ id, name, km }) => ({ id, name, km })) }));
}

export async function getCamp({ id, lang = 'ko' } = {}) {
  const camp = (await allCamps(lang)).find((c) => c.id === String(id));
  if (!camp) throw new Error(`캠핑장을 찾을 수 없어요: ${id}`);
  return { camp, stories: storiesNear(camp, lang, 3), nearby: await nearbyPlaces(camp, lang) };
}

// TourAPI 위치기반 조회 — 캠핑장 반경 3km (키 없거나 실패하면 [])
async function nearbyPlaces(c, lang) {
  if (!process.env.DATA_GO_KR_KEY) return [];
  try {
    const params = new URLSearchParams({
      serviceKey: process.env.DATA_GO_KR_KEY, MobileOS: 'ETC', MobileApp: 'HarubangWindCamp', _type: 'json',
      numOfRows: '6', pageNo: '1', mapX: String(c.lng), mapY: String(c.lat), radius: '3000',
    });
    const r = await fetch(`${TOUR}/${TOUR_SERVICE[lang] ?? TOUR_SERVICE.ko}/locationBasedList2?${params}`);
    const item = JSON.parse(await r.text())?.response?.body?.items?.item ?? [];
    return (Array.isArray(item) ? item : [item]).map((p) => ({ id: p.contentid, title: p.title, addr: p.addr1, image: p.firstimage }));
  } catch { return []; }
}
