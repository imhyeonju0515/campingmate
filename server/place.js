// 이야기 스팟의 사진·설명·주소 — 한국관광공사 TourAPI detailCommon2
// 스팟 좌표가 대략값이라 위치로 찾으면 엉뚱한 곳이 붙어서, stories.js 에 직접 확인해 둔 contentId(tourId)로만 조회합니다.
import { STORIES, pick } from './data/stories.js';

const TOUR = 'https://apis.data.go.kr/B551011';
const SERVICE = { ko: 'KorService2', en: 'EngService2', zh: 'ChsService2', ja: 'JpnService2' };
const cache = new Map();

// TourAPI 설명(overview)에는 <br> 같은 태그가 섞여 있어 글자만 남깁니다
const plain = (s = '') => s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

async function fetchCommon(tourId, svc) {
  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_KEY, MobileOS: 'ETC', MobileApp: 'HarubangWindCamp', _type: 'json', contentId: tourId,
  });
  const r = await fetch(`${TOUR}/${svc}/detailCommon2?${params}`);
  const item = JSON.parse(await r.text())?.response?.body?.items?.item;
  return Array.isArray(item) ? item[0] : item ?? null;
}

export async function getStoryPlace({ id, lang = 'ko' } = {}) {
  const s = STORIES.find((x) => x.id === id);
  if (!s) throw new Error('없는 스토리');
  const base = { id, name: pick(s.name, lang), area: s.area, story: pick(s.story, lang), found: false };
  if (!s.tourId || !process.env.DATA_GO_KR_KEY) return base;

  const key = `${id}:${lang}`;
  if (cache.has(key)) return cache.get(key);
  try {
    // 선택한 언어 서비스에 없으면 한국어로 대체
    const item = (lang !== 'ko' && (await fetchCommon(s.tourId, SERVICE[lang]).catch(() => null))) || (await fetchCommon(s.tourId, SERVICE.ko));
    if (!item) return base;
    const out = {
      ...base, found: true,
      title: item.title, addr: [item.addr1, item.addr2].filter(Boolean).join(' '),
      image: item.firstimage || null, overview: plain(item.overview),
    };
    cache.set(key, out);
    return out;
  } catch { return base; }
}
