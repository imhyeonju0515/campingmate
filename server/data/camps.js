// 샘플 캠핑장 — 고캠핑 API 키가 없거나 응답이 비었을 때만 쓰는 "자리표시" 데이터입니다.
// 실제 업체가 아니며, 이름·위치는 지역 대표 좌표만 쓴 가상의 예시입니다.
export const SAMPLE_CAMPS = [
  { id: 'sample-1', region: '제주시', types: ['normal', 'car'], lat: 33.4620, lng: 126.3290, pet: false,
    name: { ko: '[샘플] 애월 바닷가 캠프', en: '[Sample] Aewol Seaside Camp' },
    intro: { ko: '서쪽 해안, 노을 방향이 열린 가상의 샘플 캠핑장입니다.', en: 'A fictional sample site on the west coast, open to the sunset.' } },
  { id: 'sample-2', region: '제주시', types: ['car', 'glamp'], lat: 33.5200, lng: 126.8500, pet: true,
    name: { ko: '[샘플] 구좌 오름 캠프', en: '[Sample] Gujwa Oreum Camp' },
    intro: { ko: '동쪽 오름 지대 근처의 가상 샘플입니다.', en: 'A fictional sample near the eastern oreum belt.' } },
  { id: 'sample-3', region: '서귀포시', types: ['normal'], lat: 33.4500, lng: 126.9000, pet: false,
    name: { ko: '[샘플] 성산 일출 캠프', en: '[Sample] Seongsan Sunrise Camp' },
    intro: { ko: '성산 일출봉 방향의 가상 샘플입니다.', en: 'A fictional sample toward Seongsan Ilchulbong.' } },
  { id: 'sample-4', region: '서귀포시', types: ['caravan', 'glamp'], lat: 33.2500, lng: 126.4100, pet: true,
    name: { ko: '[샘플] 중문 카라반 캠프', en: '[Sample] Jungmun Caravan Camp' },
    intro: { ko: '남쪽 해안 가상 카라반 샘플입니다.', en: 'A fictional caravan sample on the south coast.' } },
  { id: 'sample-5', region: '서귀포시', types: ['normal', 'car'], lat: 33.2300, lng: 126.3200, pet: false,
    name: { ko: '[샘플] 산방산 아래 캠프', en: '[Sample] Under Sanbangsan Camp' },
    intro: { ko: '산방산 근처 가상 샘플입니다.', en: 'A fictional sample near Sanbangsan.' } },
]
