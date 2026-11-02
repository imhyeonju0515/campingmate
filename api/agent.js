import Anthropic from '@anthropic-ai/sdk';
import { getCamp, listCamps, listStories } from '../server/camps.js';
import { getCondition } from '../server/condition.js';
import { searchHeritage } from '../server/heritage.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-5-5';

// ① 도구 설명서: Claude는 이 설명만 보고 "어떤 도구를 언제 쓸지" 결정한다
const tools = [
  {
    name: 'list_camps',
    description: '한국관광공사 고캠핑 데이터로 제주 캠핑장 목록(유형·지역·반려동물 가능 여부·좌표)과 가까운 오름·신화 스토리를 조회한다',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '이름·주소 검색어' },
        region: { type: 'string', enum: ['제주시', '서귀포시'] },
        type: { type: 'string', enum: ['normal', 'car', 'glamp', 'caravan'], description: '일반야영 / 자동차야영 / 글램핑 / 카라반' },
      },
    },
  },
  {
    name: 'get_camp_detail',
    description: '캠핑장 하나의 상세, 근처 오름·신화 스토리, 한국관광공사 TourAPI 주변 장소를 조회한다',
    input_schema: { type: 'object', properties: { campId: { type: 'string' } }, required: ['campId'] },
  },
  {
    name: 'list_oreum_stories',
    description: '제주 오름·신화·화산 스토리 스팟 목록을 조회한다 (tag: myth 신화, oreum 오름, volcano 화산)',
    input_schema: {
      type: 'object',
      properties: { tag: { type: 'string', enum: ['myth', 'oreum', 'volcano'] }, area: { type: 'string', enum: ['제주시', '서귀포시'] } },
    },
  },
  {
    name: 'get_camp_condition',
    description: '기상청 단기예보(풍속·풍향·강수), 에어코리아 미세먼지, 천문연구원 일몰 시간, 달 밝기로 제주시/서귀포시의 오늘 캠핑 컨디션을 조회한다',
    input_schema: {
      type: 'object',
      properties: { place: { type: 'string', enum: ['제주시', '서귀포시'] } },
      required: ['place'],
    },
  },
  {
    name: 'search_heritage',
    description: '국가유산청 API로 제주의 국가유산(문화재)을 이름으로 검색한다. 이야기 소재용',
    input_schema: { type: 'object', properties: { keyword: { type: 'string' } } },
  },
];

const LANG_NAME = { ko: '한국어', en: 'English', zh: '简体中文', ja: '日本語' };

// ② 도구 이름 → 실제 실행할 함수 (lang 은 서버에서 붙여 줍니다)
const makeRunTool = (lang) => ({
  list_camps: (a) => listCamps({ ...a, lang }),
  get_camp_detail: (a) => getCamp({ id: a.campId, lang }),
  list_oreum_stories: (a) => listStories({ ...a, lang }),
  get_camp_condition: getCondition,
  search_heritage: searchHeritage,
});

const system = (lang) => `너는 '하르방 campmate'의 캐릭터 '하르방이'(돌하르방)다. 바람을 읽어 캠핑장을 고르고, 근처 오름·신화 이야기를 들려준다.
- 캠핑장·날씨·바람·일몰·유산 정보는 반드시 도구로 확인한 뒤 답한다. 도구 결과에 없는 장소·수치·시설은 지어내지 않는다.
- 캠핑장 데이터의 source 가 'sample' 이면 실제 업체가 아닌 가상 예시이므로, 실제 추천처럼 말하지 말고 샘플이라고 밝힌다.
- 바람 등급 기준(경험칙, 공식 안전 기준 아님): 4m/s 미만 잔잔, 4~7 산들바람, 7~10 강풍 주의, 10 이상 텐트 위험.
- 일반야영은 강풍 주의부터 비추천, 자동차야영은 위험 단계에서 비추천, 글램핑·카라반은 비교적 바람에 강하다. 위험하면 날짜 변경이나 실내형 숙소도 제안한다.
- 비 예보나 미세먼지가 나쁘면 함께 알려 준다.
- 예약·연락처를 물으면 도구 결과의 tel(전화), resveUrl(온라인 예약), homepage, reserve(예약 방식)만 그대로 알려 준다. 값이 비어 있으면 "등록된 정보가 없다"고 말하고 번호나 주소를 지어내지 않는다. 요금·예약 가능 여부는 직접 확인하라고 덧붙인다.
- 캠핑장을 추천할 때는 가까운 오름·신화 스토리 한 가지를 곁들여 짧게 들려준다.
- 친근하고 약간 익살스러운 하르방 말투로, 6문장 이내로 짧게.
- 반드시 ${LANG_NAME[lang] ?? LANG_NAME.ko}로 답한다.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { message, history = [], lang = 'ko' } = req.body ?? {};
  const runTool = makeRunTool(lang);
  const messages = [...history.slice(-10), { role: 'user', content: message }]; // 최근 10개만 보내 비용 절약
  const steps = []; // 화면에 "에이전트가 무엇을 했는지" 보여주기용

  try {
    // ③ 에이전트 루프: 생각 → 도구 호출 → 결과 확인 → (반복) → 최종 답
    for (let turn = 0; turn < 6; turn++) {
      const r = await client.messages.create({
        model: MODEL, max_tokens: 1024, system: system(lang), tools, messages,
      });

      if (r.stop_reason !== 'tool_use') {
        const answer = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
        return res.status(200).json({ answer, steps });
      }

      messages.push({ role: 'assistant', content: r.content });
      const results = [];
      for (const block of r.content) {
        if (block.type !== 'tool_use') continue;
        let result;
        try { result = await runTool[block.name](block.input ?? {}); }
        catch (e) { result = { error: e.message }; }
        steps.push({ tool: block.name, args: block.input, count: Array.isArray(result) ? result.length : 1 });
        results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
      }
      messages.push({ role: 'user', content: results });
    }
    res.status(200).json({ answer: '도구 호출이 너무 많아 중단했어요. 질문을 좁혀 주세요.', steps });
  } catch (e) {
    res.status(e.status ?? 500).json({ error: e.status === 429 ? '사용량이 많아요. 1분 뒤 다시 시도하세요.' : e.message });
  }
}
