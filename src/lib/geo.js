// 위치 관련 도우미 — 두 좌표 사이 거리(km)와, 브라우저 위치 한 번 읽기

// 도장은 이 거리 안에서만 찍을 수 있습니다. 이야기 스팟 좌표가 대략값이라 500m 는 정상 위치에서도 실패할 수 있어 1km 로 둡니다.
export const STAMP_RADIUS_KM = 1

export function distKm(aLat, aLng, bLat, bLng) {
  const R = 6371, rad = (d) => (d * Math.PI) / 180
  const dLat = rad(bLat - aLat), dLng = rad(bLng - aLng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// 현재 위치 → { lat, lng }. 실패하면 code 가 'unsupported' | 'denied' | 'unavailable' 인 에러를 던집니다
export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(Object.assign(new Error('unsupported'), { code: 'unsupported' }))
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => reject(Object.assign(new Error(e.message), { code: e.code === 1 ? 'denied' : 'unavailable' })),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    )
  })
}
