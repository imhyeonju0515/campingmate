// "오늘 캠핑하기 어떤가?" — 기상청(풍속·강수) + 에어코리아 + 천문연구원(일몰)을 합쳐 good / ok / bad 로 판정
import { getWeather } from './weather.js';
import { getAir } from './air.js';
import { getSun, moonPhase } from './sun.js';
import { windGrade } from './wind.js';

export async function getCondition({ place = '제주시' } = {}) {
  const [w, a, s] = await Promise.allSettled([getWeather({ place }), getAir(), getSun()]);
  const weather = w.status === 'fulfilled' ? (w.value[0] ?? null) : null;
  const airRaw = a.status === 'fulfilled' ? a.value : null;
  const air = airRaw && (airRaw.pm10 != null || airRaw.pm25 != null) ? airRaw : null;   // 값이 비면 없는 것으로
  const sun = s.status === 'fulfilled' ? s.value : null;
  const errors = [w, a, s].filter((x) => x.status === 'rejected').map((x) => x.reason.message);

  const grade = weather ? windGrade(weather.wind) : 'unknown';
  let camp = 'unknown';
  if (weather) {   // 풍속·강수 예보가 있어야 판정합니다 (미세먼지만으로는 판정하지 않음)
    const bad = grade === 'danger' || weather.rain !== '없음' || weather.pop >= 60 || air?.pm10 >= 80;
    const mid = grade === 'strong' || weather.pop >= 30 || air?.pm10 >= 31;
    camp = bad ? 'bad' : mid ? 'ok' : 'good';
  }
  return { place, weather, air, sun, moon: moonPhase(), windGrade: grade, camp, errors };
}
