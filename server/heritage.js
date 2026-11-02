// 국가유산청 국가유산 검색 오픈API (키 불필요, XML 응답)
import { XMLParser } from 'fast-xml-parser';
import { HERITAGE_TR, KIND_TR } from './data/translations.js';
const parser = new XMLParser();

export async function searchHeritage({ keyword = '', rows = 8, lang = 'ko' } = {}) {
  const params = new URLSearchParams({ ccbaCtcd: '50', pageUnit: String(rows), pageIndex: '1' }); // 50 = 제주
  if (keyword) params.set('ccbaMnm1', keyword);
  const r = await fetch(`https://www.khs.go.kr/cha/SearchKindOpenapiList.do?${params}`);
  const data = parser.parse(await r.text());
  const item = data?.result?.item;
  const list = !item ? [] : Array.isArray(item) ? item : [item];
  const all = list.map((h) => ({ name: h.ccbaMnm1, kind: h.ccmaName, city: h.ccsiName, lat: h.latitude, lng: h.longitude }));
  if (lang === 'ko') return all;
  // 국가유산청 API 는 한국어뿐이라, 번역해 둔 항목만 보여 줍니다 (번역이 없는 항목은 한국어를 그대로 내보내지 않고 뺍니다)
  return all.filter((h) => HERITAGE_TR[h.name]?.[lang])
    .map((h) => ({ ...h, name: HERITAGE_TR[h.name][lang], kind: KIND_TR[h.kind]?.[lang] ?? '' }));
}
