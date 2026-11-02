// 공공데이터 API 는 하루 요청 횟수 제한이 있어서(개발 계정은 수백~수천 회), 같은 요청을 잠깐 기억해 두고 다시 씁니다.
// 화면을 열 때마다 API 를 부르면 금방 한도(LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR)에 닿습니다.
// - ttlMs 안에는 저장해 둔 값을 그대로 돌려줍니다.
// - API 가 실패하면(한도 초과 등) 오래된 값이라도 있으면 그것을 돌려줍니다. 아무것도 없을 때만 에러를 냅니다.
// ※ Vercel 서버리스는 인스턴스마다 메모리가 따로라 완전하지는 않지만, 같은 인스턴스가 재사용되는 동안은 효과가 있습니다.
const store = new Map();

export async function cached(key, ttlMs, fn) {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  try {
    const value = await fn();
    store.set(key, { at: Date.now(), value });
    return value;
  } catch (e) {
    if (hit) return hit.value;
    throw e;
  }
}
