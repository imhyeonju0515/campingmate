// 한국어 주소 → 선택한 언어로 바꾸기 (고캠핑 주소는 한국어뿐이라서 직접 변환합니다)
//  en : 도로명주소 영문 표기 순서(번지 → 도로 → 읍·면·동 → 시 → 도)로 로마자 표기. 예) 746 Haso-ro, Aewol-eup, Jeju-si, Jeju-do
//  zh/ja : 도·시·읍·면은 한자 이름으로, 나머지(리·도로명·번지)는 로마자로 — 한자·가타카나 표기를 임의로 만들지 않기 위해서입니다
// 로마자는 발음 변화를 적용하지 않고 글자 하나씩 옮기는 방식(공식 도로명 표기와 같은 방식: 북로 → buk-ro)입니다.
import romanizePkg from '@romanize/korean';   // CommonJS 패키지라 이름 가져오기가 안 돼서 기본값으로 받습니다
const { romanize } = romanizePkg;

const ADMIN = {
  zh: {
    '제주특별자치도': '济州特别自治道', '제주시': '济州市', '서귀포시': '西归浦市',
    '한림읍': '翰林邑', '애월읍': '涯月邑', '구좌읍': '旧左邑', '조천읍': '朝天邑', '한경면': '翰京面', '추자면': '楸子面', '우도면': '牛岛面',
    '대정읍': '大静邑', '남원읍': '南元邑', '성산읍': '城山邑', '안덕면': '安德面', '표선면': '表善面',
  },
  ja: {
    '제주특별자치도': '済州特別自治道', '제주시': '済州市', '서귀포시': '西帰浦市',
    '한림읍': '翰林邑', '애월읍': '涯月邑', '구좌읍': '旧左邑', '조천읍': '朝天邑', '한경면': '翰京面', '추자면': '楸子面', '우도면': '牛島面',
    '대정읍': '大静邑', '남원읍': '南元邑', '성산읍': '城山邑', '안덕면': '安徳面', '표선면': '表善面',
  },
  // 읍·면은 공식 영문 표기가 발음 기준이라(한림 → Hallim) 따로 둡니다
  en: {
    '제주특별자치도': 'Jeju-do', '제주시': 'Jeju-si', '서귀포시': 'Seogwipo-si',
    '한림읍': 'Hallim-eup', '애월읍': 'Aewol-eup', '구좌읍': 'Gujwa-eup', '조천읍': 'Jocheon-eup', '한경면': 'Hangyeong-myeon', '추자면': 'Chuja-myeon', '우도면': 'Udo-myeon',
    '대정읍': 'Daejeong-eup', '남원읍': 'Namwon-eup', '성산읍': 'Seongsan-eup', '안덕면': 'Andeok-myeon', '표선면': 'Pyoseon-myeon',
  },
};
const SUFFIX = ['번길', '읍', '면', '동', '리', '로', '길', '시', '군', '구', '가'];

const HANGUL = /[가-힣]/;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// 글자 하나씩 로마자로 (발음 변화 없이)
const translit = (s) => [...s].map((c) => (HANGUL.test(c) ? romanize(c) : c)).join('');

function roman(token) {
  // 도원로26번길 → Dowon-ro 26beon-gil / 교래4길 → Gyorae 4-gil
  const m = token.match(/^(.+?)(\d+)(번길|길|로)$/);
  if (m && HANGUL.test(m[1])) {
    const tail = m[3] === '번길' ? 'beon-gil' : `-${translit(m[3])}`;
    const name = /[로길]$/.test(m[1]) ? roman(m[1]) : cap(translit(m[1]));   // 도원로 + 26번길 처럼 앞에 도로명이 또 있는 경우
    return `${name} ${m[2]}${tail}`;
  }
  if (/^\d+(-\d+)?번길$/.test(token)) return token.replace('번길', 'beon-gil');
  if (/^산\d/.test(token)) return `San ${token.slice(1)}`;
  if (token === '산') return 'San';
  if (/^[\d-]+$/.test(token)) return token;
  const suf = SUFFIX.find((s) => token.length > s.length && token.endsWith(s));
  if (suf) return `${cap(translit(token.slice(0, -suf.length)))}-${translit(suf)}`;
  return cap(translit(token));
}

export function localizeAddr(addr, lang = 'ko') {
  if (!addr || lang === 'ko') return addr ?? '';
  const dict = ADMIN[lang] ?? ADMIN.en;
  // "(이도일동)" 같은 괄호 부가정보는 뺍니다
  const tokens = addr.replace(/\([^)]*\)/g, ' ').split(/\s+/).filter(Boolean);

  // "산" 은 뒤 번지와 붙입니다 (산 59-8 → 산59-8)
  const merged = [];
  for (const t of tokens) {
    if (merged.at(-1) === '산' && /^\d/.test(t)) merged[merged.length - 1] = `산${t}`;
    else merged.push(t);
  }

  const out = merged.map((t) => dict[t] ?? roman(t));

  if (lang !== 'en') return out.join(' ');

  // 영문 순서: 번지가 맨 앞, 큰 지역이 맨 뒤
  const isNum = (s) => /^(San )?[\d-]+$/.test(s);
  const parts = [];
  for (let i = 0; i < out.length; i++) {
    const nxt = out[i + 1];
    if (nxt && isNum(nxt) && !isNum(out[i])) { parts.push(`${nxt} ${out[i]}`); i++; }
    else parts.push(out[i]);
  }
  return parts.reverse().join(', ');
}
