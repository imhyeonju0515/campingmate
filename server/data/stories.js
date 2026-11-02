// 오름·신화 스토리 스팟 (샘플) — 캠핑장 근처에서 도장을 모으는 이야기 카드
// ※ 좌표는 대략값입니다. name / story 는 { ko, en, zh, ja } — 없는 언어는 en → ko 순으로 대체됩니다.
// tourId: 한국관광공사 TourAPI contentId (직접 확인한 것만 — 산방산은 TourAPI 에 같은 이름의 항목이 없어 비워 둠)
// tag: myth(신화·전설) · oreum(오름) · volcano(화산·지질)
export const STORIES = [
  {
    id: 's-samseonghyeol', tourId: '127744', area: '제주시', tag: 'myth', lat: 33.5060, lng: 126.5240, keyword: '삼성혈',
    name: { ko: '삼성혈', en: 'Samseonghyeol', zh: '三姓穴', ja: '三姓穴' },
    story: {
      ko: '탐라를 세운 세 신인(고을나·양을나·부을나)이 땅에서 솟아났다는 탐라 건국 신화의 구멍이에요.',
      en: 'The three holes where the founding gods of Tamna are said to have risen from the earth.',
    },
  },
  {
    id: 's-saebyeol', tourId: '572973', area: '제주시', tag: 'oreum', lat: 33.3653, lng: 126.3592, keyword: '',
    name: { ko: '새별오름', en: 'Saebyeol Oreum', zh: '新星岳', ja: 'セビョル・オルム' },
    story: {
      ko: '저녁 하늘에 외롭게 뜬 샛별 같다 해서 새별오름. 억새와 들불 놓는 풍습을 잇는 축제로 알려진 오름이에요.',
      en: 'Named for the lone “morning star” in the evening sky; famous for silvergrass and a fire-lighting festival tradition.',
    },
  },
  {
    id: 's-geomun', tourId: '636266', area: '제주시', tag: 'volcano', lat: 33.4358, lng: 126.7131, keyword: '거문오름',
    name: { ko: '거문오름', en: 'Geomunoreum', zh: '拒文岳', ja: 'コムンオルム' },
    story: {
      ko: '용암이 흘러 만든 동굴계의 시작점. ‘제주 화산섬과 용암동굴’ 세계자연유산의 한 곳이에요.',
      en: 'The source of a lava-tube system, part of the UNESCO site “Jeju Volcanic Island and Lava Tubes”.',
    },
  },
  {
    id: 's-yongnuni', tourId: '572960', area: '제주시', tag: 'oreum', lat: 33.4608, lng: 126.7890, keyword: '',
    name: { ko: '용눈이오름', en: 'Yongnuni Oreum', zh: '龙眼岳', ja: 'ヨンヌニ・オルム' },
    story: {
      ko: '용이 누웠다 간 자리처럼 부드러운 능선이 이어지는 오름. 바람 부는 억새 능선이 매력이에요.',
      en: 'Soft ridgelines like a dragon that lay down to rest; breezy silvergrass slopes.',
    },
  },
  {
    id: 's-darangshi', tourId: '577461', area: '제주시', tag: 'oreum', lat: 33.4707, lng: 126.8043, keyword: '',
    name: { ko: '다랑쉬오름', en: 'Darangshi Oreum', zh: '月郎峰', ja: 'タランシ・オルム' },
    story: {
      ko: '둥근 달처럼 깊고 둥근 분화구를 품은 오름이에요. 정상에서 동쪽 바다까지 시원하게 보여요.',
      en: 'An oreum with a deep, moon-round crater; the summit looks out to the eastern sea.',
    },
  },
  {
    id: 's-ilchulbong', tourId: '126435', area: '서귀포시', tag: 'volcano', lat: 33.4580, lng: 126.9425, keyword: '성산일출봉',
    name: { ko: '성산일출봉', en: 'Seongsan Ilchulbong', zh: '城山日出峰', ja: '城山日出峰' },
    story: {
      ko: '바다에서 솟은 수성화산. 해가 뜨는 봉우리라는 이름처럼 새벽 풍경으로 유명해요.',
      en: 'A tuff cone risen from the sea, famous for its sunrise.',
    },
  },
  {
    id: 's-yeongsil', tourId: '126469', area: '서귀포시', tag: 'myth', lat: 33.3553, lng: 126.4950, keyword: '한라산',
    name: { ko: '영실기암·오백장군', en: 'Yeongsil Rocks (Five Hundred Generals)', zh: '灵室奇岩·五百将军', ja: '霊室奇岩・五百将軍' },
    story: {
      ko: '설문대할망의 오백 아들이 바위가 되었다는 전설이 전해지는 한라산 기암 절벽이에요.',
      en: 'Rocky pillars of Hallasan said to be the five hundred sons of the giantess Seolmundae, turned to stone.',
    },
  },
  {
    id: 's-sanbang', area: '서귀포시', tag: 'myth', lat: 33.2392, lng: 126.3142, keyword: '산방산',
    name: { ko: '산방산', en: 'Sanbangsan', zh: '山房山', ja: '山房山' },
    story: {
      ko: '한라산 봉우리가 뽑혀 날아와 생겼다는 전설의 종 모양 용암돔이에요.',
      en: 'A bell-shaped lava dome, said to be the summit of Hallasan torn off and thrown here.',
    },
  },
  {
    id: 's-songak', tourId: '126672', area: '서귀포시', tag: 'oreum', lat: 33.2051, lng: 126.2894, keyword: '',
    name: { ko: '송악산', en: 'Songaksan', zh: '松岳山', ja: '松岳山' },
    story: {
      ko: '이중 화구와 마라도·가파도가 한눈에 들어오는 바람 많은 오름이에요.',
      en: 'A windy oreum with a double crater and views of Marado and Gapado.',
    },
  },
]

export const pick = (obj, lang = 'ko') => obj?.[lang] ?? obj?.en ?? obj?.ko ?? ''
