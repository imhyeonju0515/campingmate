// 캠핑장 목록 + 근처 오름·신화 스토리 + 주변 장소
// - DATA_GO_KR_KEY 가 있으면 한국관광공사 고캠핑(GoCamping) API 에서 제주 야영장을 가져옵니다.
// - 키가 없거나 응답이 비면 샘플(가상) 캠핑장으로 대체합니다.
import { localizeAddr } from './addr.js';
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

// 외부 API 가 준 URL 은 http(s) 만 허용 (javascript: 같은 값 차단). 스킴이 없으면 https 로 보정
function safeUrl(u = '') {
  const s = String(u).trim();
  if (!s) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    return /^https?:$/.test(url.protocol) && url.hostname.includes('.') ? url.href : '';
  } catch { return ''; }
}

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
        addr: c.addr1, image: c.firstImageUrl,
        // 연락·예약: tel(전화), homepage(홈페이지), resveUrl(온라인 예약 링크), reserve(예약 방식: 전화·온라인실시간예약·온라인예약대기·현장)
        tel: String(c.tel ?? '').trim(), homepage: safeUrl(c.homepage), resveUrl: safeUrl(c.resveUrl),
        reserve: String(c.resveCl ?? '').split(',').map((x) => x.trim()).filter(Boolean),
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

// 주소를 선택한 언어로 (검색은 한국어 원문으로 끝난 뒤에 바꿉니다). addrKo 는 지도·택시용 한국어 원문
const localizeCamp = (c, lang) => (lang === 'ko' ? c : { ...c, addr: localizeAddr(c.addr, lang), addrKo: c.addr });

export async function listCamps({ lang = 'ko', keyword = '', type = '', region = '' } = {}) {
  const kw = keyword.trim().toLowerCase();
  return (await allCamps(lang))
    .filter((c) => (!type || c.types.includes(type)) && (!region || c.region === region)
      && (!kw || `${c.name} ${c.intro ?? ''} ${c.addr ?? ''}`.toLowerCase().includes(kw)))
    .map((c) => ({ ...localizeCamp(c, lang), stories: storiesNear(c, lang, 2).map(({ id, name, km }) => ({ id, name, km })) }));
}

export async function getCamp({ id, lang = 'ko' } = {}) {
  const camp = (await allCamps(lang)).find((c) => c.id === String(id));
  if (!camp) throw new Error(`캠핑장을 찾을 수 없어요: ${id}`);
  return { camp: localizeCamp(camp, lang), stories: storiesNear(camp, lang, 3), nearby: await nearbyPlaces(camp, lang) };
}

// 외국어판 TourAPI 제목에는 한국어 원제가 괄호나 이어붙여 들어 있어서(예: Sanbangsan Canola Field (산방산유채꽃밭)) 한국어 부분부터 잘라냅니다
function foreignText(text = '', lang) {
  if (lang === 'ko') return text;
  const i = text.search(/[\uAC00-\uD7A3]/);
  if (i < 0) return text;
  const cut = text.slice(0, i).replace(/[\s(（\[【]+$/, '').trim();
  return cut || text;
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
    return (Array.isArray(item) ? item : [item]).map((p) => ({ id: p.contentid, title: foreignText(p.title, lang), addr: foreignText(p.addr1, lang), image: p.firstimage }));
  } catch { return []; }
}
