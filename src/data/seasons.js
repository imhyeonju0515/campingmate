// 제주 4계절 신화 & 캠핑 가이드
// 각 계절별 설문대할망 외 제주 신화 캐릭터, 추천 오름, 팁
export const SEASONS = {
  SPRING: {
    id: 'spring',
    ko: { name: '봄 (자청비의 탄생)', myth: '농경의 신 자청비가 생명의 기운과 새싹을 피워내는 계절', tip: '일교차가 크니 가벼운 레이어드 겉옷이 필수예요.', recommendedSpots: ['삼성혈', '새별오름'] },
    en: { name: 'Spring (Birth of Jacheongbi)', myth: 'The season when the agricultural goddess Jacheongbi awakens life and new sprouts', tip: 'Bring layered clothing for the temperature difference between day and night.', recommendedSpots: ['삼성혈', '새별오름'] },
    zh: { name: '春季（自清比的诞生）', myth: '农业女神自清比唤醒生命和新芽的季节', tip: '由于昼夜温差大，轻薄的分层外衣是必需的。', recommendedSpots: ['삼성혈', '새별오름'] },
    ja: { name: '春（自清比の誕生）', myth: '農業の女神自清比が生命と新しい芽を目覚めさせる季節', tip: '昼夜の気温差が大きいので、軽いレイヤード上着が必須です。', recommendedSpots: ['삼성혈', '새별오름'] },
    bg: 'from-emerald-50 to-green-100',
    accent: 'text-emerald-600',
    emoji: '🌸'
  },
  SUMMER: {
    id: 'summer',
    ko: { name: '여름 (영등할망의 바다 바람)', myth: '바람의 신 영등할망이 시원한 숲그늘과 바람을 불어주는 계절', tip: '습도와 소나기에 대비한 방수 텐트와 모기약이 중요해요.', recommendedSpots: ['용눈이오름', '거문오름'] },
    en: { name: 'Summer (Yeondeunghalmang\'s Sea Wind)', myth: 'The season when the wind goddess Yeondeunghalmang brings cool shade and breezes', tip: 'Bring a waterproof tent and insect repellent for humidity and sudden showers.', recommendedSpots: ['용눈이오름', '거문오름'] },
    zh: { name: '夏季（灵等婆婆的海风）', myth: '风之女神灵等婆婆带来凉爽树荫和微风的季节', tip: '为了应对湿度和阵雨，防水帐篷和驱蚊剂很重要。', recommendedSpots: ['용눈이오름', '거문오름'] },
    ja: { name: '夏（灵等婆の海風）', myth: '風の女神灵等婆が涼しい木陰と風をもたらす季節', tip: '湿度と夕立に備えた防水テントと虫除けが重要です。', recommendedSpots: ['용눈이오름', '거문오름'] },
    bg: 'from-blue-50 to-cyan-100',
    accent: 'text-blue-600',
    emoji: '🌊'
  },
  AUTUMN: {
    id: 'autumn',
    ko: { name: '가을 (감은장아기의 풍요)', myth: '운명의 신 감은장아기가 오름 전체를 황금빛 억새로 물들이는 계절', tip: '칼바람을 막아줄 윈드브레이커와 억새밭 야경용 랜턴을 챙기세요.', recommendedSpots: ['새별오름', '다랑쉬오름'] },
    en: { name: 'Autumn (Gameunjangagi\'s Abundance)', myth: 'The season when the fate goddess Gameunjangagi paints the oreums golden with silvergrass', tip: 'Bring a windbreaker and a lantern for night photography of the silvergrass fields.', recommendedSpots: ['새별오름', '다랑쉬오름'] },
    zh: { name: '秋季（感恩张阿记的丰收）', myth: '命运女神感恩张阿记用金色芒草染遍岳的季节', tip: '带上防风夹克和夜景摄影用的灯笼。', recommendedSpots: ['새별오름', '다랑쉬오름'] },
    ja: { name: '秋（感恩张阿记の豊かさ）', myth: '運命の女神感恩张阿记がススキで岳全体を金色に染める季節', tip: 'ウインドブレーカーと夜景撮影用のランタンを用意してください。', recommendedSpots: ['새별오름', '다랑쉬오름'] },
    bg: 'from-amber-50 to-orange-100',
    accent: 'text-amber-600',
    emoji: '🌾'
  },
  WINTER: {
    id: 'winter',
    ko: { name: '겨울 (설문대할망의 설경)', myth: '설문대할망이 백록담과 오름 위로 하얀 눈이불을 덮어주는 계절', tip: '방한 패딩과 고성능 캠핑 의자, 체온 유지용 단열 매트가 핵심이에요.', recommendedSpots: ['영실기암', '성산일출봉'] },
    en: { name: 'Winter (Seolmundae Halmang\'s Snow)', myth: 'The season when the giantess Seolmundae Halmang covers Baengrok Lake and the oreums with white quilts of snow', tip: 'Insulated padding, high-performance camping chair, and thermal mats are essential.', recommendedSpots: ['영실기암', '성산일출봉'] },
    zh: { name: '冬季（设文台婆的雪景）', myth: '巨人设文台婆用白色雪被覆盖百鹿潭和岳的季节', tip: '防寒羽绒服、高性能露营椅和保温垫是关键。', recommendedSpots: ['영실기암', '성산일출봉'] },
    ja: { name: '冬（設文台婆の雪景）', myth: '巨人設文台婆が白鹿潭と岳を白い雪布で覆う季節', tip: '断熱パッド、高性能キャンプチェア、体温保持マットが重要です。', recommendedSpots: ['영실기암', '성산일출봉'] },
    bg: 'from-slate-100 to-blue-100',
    accent: 'text-indigo-600',
    emoji: '❄️'
  }
};

export const getSeason = (lang = 'ko') => (seasonId) => SEASONS[seasonId]?.[lang] || SEASONS[seasonId]?.ko;
