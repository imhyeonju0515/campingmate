// 오름·신화 목록 화면용: 제주오름요약설명 CSV 의 오름 전체 + 각 오름 근처 캠핑장 3곳(직선거리)
// 이야기 카드가 이미 있는 스팟(새별오름·용눈이오름 등)은 중복을 피하려고 여기서 뺍니다.
import { getOreums, oreumName, distKm } from './oreums.js';
import { listCamps } from './camps.js';
import { STORIES } from './data/stories.js';
import { localizeAddr } from './addr.js';

const key = (s = '') => s.replace(/오름/g, '').replace(/[\s·]/g, '');

export async function listOreums({ lang = 'ko' } = {}) {
  const [all, camps] = await Promise.all([getOreums(), listCamps({ lang })]);
  const curated = new Set(STORIES.map((s) => key(s.name.ko)));
  return all.filter((o) => !curated.has(key(o.ko))).map((o) => ({
    id: o.id, kind: 'oreum', tag: 'oreum', name: oreumName(o, lang),
    area: o.loc.split(' ')[0],                                 // 제주시 / 서귀포시
    loc: localizeAddr(`제주특별자치도 ${o.loc}`, lang),         // 위치(읍·면·리)
    addr: localizeAddr(o.addr, lang), addrKo: lang === 'ko' ? undefined : o.addr,
    elevation: o.ele, relHeight: o.rel, lat: o.lat, lng: o.lng, image: o.image,
    desc: lang === 'ko' ? o.desc : undefined,                   // 설명은 한국어뿐
    camps: camps.map((c) => ({ c, km: distKm(o.lat, o.lng, c.lat, c.lng) }))
      .sort((a, b) => a.km - b.km).slice(0, 3)
      .map(({ c, km }) => ({ id: c.id, name: c.name, region: c.region, types: c.types, km: Math.round(km * 10) / 10 })),
  }));
}
