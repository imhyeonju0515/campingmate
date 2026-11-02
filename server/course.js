// 1박 2일 코스 재료: 캠핑장 + 가까운 스팟(오름·화산·신화) + 일출·일몰 + 바람·비 예보를 한 번에 모아 줍니다.
// AI 하르방의 get_course 도구가 씁니다(도구 호출 횟수를 아끼려고 한 번에 묶음).
// ※ 거리는 직선거리이고, 이동·등반 소요 시간은 데이터가 없어 포함하지 않습니다.
import { getCamp } from './camps.js';
import { oreumsNear } from './oreums.js';
import { getSun } from './sun.js';
import { getForecast } from './weather.js';

const kstDate = (offsetDays = 0) => new Date(Date.now() + 9 * 3600e3 + offsetDays * 86400e3).toISOString().slice(0, 10);

export async function getCourse({ campId, lang = 'ko' } = {}) {
  const { camp, stories, oreums } = await getCamp({ id: campId, lang });
  const today = kstDate(0), tomorrow = kstDate(1);
  const [sunToday, sunTomorrow, forecast] = await Promise.allSettled([getSun({ date: today }), getSun({ date: tomorrow }), getForecast({ place: camp.region })]);
  const ok = (r) => (r.status === 'fulfilled' ? r.value : null);
  return {
    camp: { id: camp.id, name: camp.name, region: camp.region, types: camp.types, tel: camp.tel, resveUrl: camp.resveUrl, reserve: camp.reserve },
    spots: stories.map((s) => ({ id: s.id, name: s.name, tag: s.tag, km: s.km, story: s.story })),   // 가까운 순, km 는 직선거리
    moreOreums: (oreums ?? []).slice(0, 4).map((o) => ({ name: o.name, km: o.km })),   // 공공데이터 오름 목록(이름·직선거리만). 글에서 이름만 언급하고 링크·id 는 없음
    sun: { [today]: ok(sunToday), [tomorrow]: ok(sunTomorrow) },
    forecast: (ok(forecast) ?? []).slice(0, 2).map((d) => ({ date: d.date, windMax: d.windMax, dir: d.dir, popMax: d.popMax, rain: d.rain, tempMin: d.tempMin, tempMax: d.tempMax })),
    note: '거리는 직선거리. 이동·등반 소요 시간 데이터는 없음.',
  };
}
