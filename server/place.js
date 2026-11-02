// 이야기 스팟의 사진·설명·주소 — 한국관광공사 TourAPI detailCommon2
// 스팟 좌표가 대략값이라 위치로 찾으면 엉뚱한 곳이 붙어서, stories.js 에 직접 확인해 둔 contentId(tourId)로만 조회합니다.
// 언어별 서비스(Kor/Eng/Chs/Jpn)는 contentId 가 서로 다르므로, 선택한 언어판이 있으면 그 공식 소개글·주소를 쓰고
// 없으면 한국어 항목의 사진을 쓰되 소개글은 translations.js 의 번역을 씁니다 (번역도 없으면 소개글은 비웁니다 — 한국어를 그대로 보여 주지 않음).
import { STORIES, pick } from './data/stories.js';
import { OVERVIEW_TR } from './data/translations.js';
import { localizeAddr } from './addr.js';

const TOUR = 'https://apis.data.go.kr/B551011';
const SERVICE = { ko: 'KorService2', en: 'EngService2', zh: 'ChsService2', ja: 'JpnService2' };
const cache = new Map();

// TourAPI 설명(overview)에는 <br> 같은 태그가 섞여 있어 글자만 남깁니다
const plain = (s = '') => s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
const HANGUL = /[가-힣]/;

async function fetchCommon(tourId, svc) {
  if (!tourId) return null;
  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_KEY, MobileOS: 'ETC', MobileApp: 'HarubangWindCamp', _type: 'json', contentId: tourId,
  });
  const r = await fetch(`${TOUR}/${svc}/detailCommon2?${params}`);
  const item = JSON.parse(await r.text())?.response?.body?.items?.item;
  return (Array.isArray(item) ? item[0] : item) ?? null;
}

export async function getStoryPlace({ id, lang = 'ko' } = {}) {
  const s = STORIES.find((x) => x.id === id);
  if (!s) throw new Error('없는 스토리');
  const base = { id, name: pick(s.name, lang), area: s.area, story: pick(s.story, lang), found: false };
  if (!s.tourId || !process.env.DATA_GO_KR_KEY) return base;

  const key = `${id}:${lang}`;
  if (cache.has(key)) return cache.get(key);
  try {
    const ko = await fetchCommon(s.tourId.ko, SERVICE.ko).catch(() => null);
    const loc = lang === 'ko' ? ko : await fetchCommon(s.tourId[lang], SERVICE[lang]).catch(() => null);
    if (!ko && !loc) return base;

    // 소개글: 그 언어판 공식 글 → 우리 번역 → (한국어일 때만) 한국어 글. 외국어 화면에 한국어를 그대로 내보내지 않습니다.
    let overview = plain(loc?.overview), translated = false;
    if (lang !== 'ko' && (!overview || HANGUL.test(overview.slice(0, 40)))) {
      overview = OVERVIEW_TR[id]?.[lang] ?? '';
      translated = Boolean(overview);
    }

    // 주소: 그 언어판 주소가 번지까지 있으면 그것, 아니면 한국어 주소를 변환
    const addrKo = [ko?.addr1, ko?.addr2].filter(Boolean).join(' ').replace(/\s*\([^)]*\)\s*$/, '');
    const locAddr = loc ? [loc.addr1, loc.addr2].filter(Boolean).join(' ').trim() : '';
    const addr = lang === 'ko' ? addrKo : (locAddr && /\d/.test(locAddr) && !HANGUL.test(locAddr) ? locAddr : localizeAddr(addrKo, lang));

    const out = {
      ...base, found: true, addr, addrKo,
      image: loc?.firstimage || ko?.firstimage || null,   // 사진은 언어와 무관하므로 없으면 한국어 항목 것
      overview, translated,
    };
    cache.set(key, out);
    return out;
  } catch { return base; }
}
